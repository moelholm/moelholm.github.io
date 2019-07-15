---
layout: post
title: "Arquillian: Testing legacy applications"
description: "A trick demonstrating how you can test legacy Java EE 7 applications"
date: 2016-08-12
comments: true
---

This post describes a technique that my previous colleagues and I successfully used for integration testing a large and complex legacy Java EE 7 application (EAR file). The tests were successfully implemented using Arquillian along with a few WildFly tricks.

Just want to see the solution? Then skip the next section, [Background](#Background), and go straight to the section, [Solution: Privileged anemic test archives](#Solution-Privileged-anemic-test-archives).

### Background
A while back I worked with a very large and complex Java EE 7 EAR application. It had literally hundreds of EJBs, CDI beans and Web components. Each with vast amounts of transitive dependencies to other Java EE components, Java EE services (JPA, Transaction Manager, messaging system, etc), ordinary Java POJOs and so on. This application didn't start its life as a Java EE 7 application - it had been upgraded from a Java EE 5 application.

Since the application was based on Java EE 7 and running in a WildFly 8.2 application server my colleagues and I decided to give Arquillian integration tests a shot. Arquillian test examples that you find on the internet tend to be super nice and lean - so why not?

But we had to give up:
<ul>
	<li>The components that we wanted to test had so many dependencies that the Arquillian test archives became impractical:
<ul>
	<li>We ended up bundling endless amounts of classes needed by the SUT.</li>
	<li>But it was not just Java classes - also JMS resources, JPA bootstrapping, cache configurations, security configurations and much more.</li>
</ul>
</li>
	<li>Additionally, the application components required generic expensive bootstrapping that was impractical to impose on every test archive. Especially for running tests against existing database configurations.</li>
	<li>But the worst thing in, my opinion, was that _the test archives ended up testing a false reality_ : our system wasn't bundled the same way, class loader wise and structure wise. Despite our best attempts we ended up with test archives that wasn't anything like what we were actually running in production.</li>
</ul>
Now, one may argue that the system wasn't really well designed - since we had to bundle so many dependencies with our test archives. And this is likely true. But recall that we are talking about an existing extremely complex legacy application - so that was simply our reality. And redesigning the application wasn't practical at all - not in polynomial time at least.

### Solution: Privileged anemic test archives
We realised that we couldn't introduce vanilla Arquillian integration tests successfully in our system. So we came up with the following solution:
<ul>
	<li>Deploy the application EAR file as if it where a normal production deployment</li>
	<li>Deploy socalled _privileged anemic test archives_ (Arquillian):
<ul>
	<li>Anemic because the test archives only contains the test classes itself (including any support classes). Not the business component under test - no business code at all. Note that this is very much _unlike_ the traditional Arquillian integration tests.</li>
	<li>Privileged because the test archives, ClassLoader wise, can use any class or resource from the EAR file</li>
</ul>
</li>
</ul>
This solution allowed us to inject any EJB or CDI component from the application EAR running in WildFly _into_ the volatile Arquillian test archives deployed on/off during the test jobs.

Last year, sorry for this delayed blog post, I prepared a GitHub example that illustrates the technique. It is based on WildFly 8.2 and uses Arquillian to illustrate how to gain visibility from a test archive into an EAR archive - find it here: [GitHub Example](https://github.com/nickymoelholm/smallexamples/tree/master/hello-arquillian-wildfly-multideployment).

A sneak peak into that example:

```java
@RunWith(WildFlyEmbeddedArquillianRunner.class)
public class MultiDeploymentIntegrationTest {

 @Deployment(name = "myapp", order = 1)
 public static EnterpriseArchive createEar() {
     return ShrinkWrap.create(EnterpriseArchive.class, "myapp.ear")
         .addAsModule(
             ShrinkWrap.create(JavaArchive.class, "myejbmodule.jar")
             .addClass(BusinessServiceBean.class)
             .addClass(AnotherBusinessServiceBean.class)
             .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml"));
 }

 @Deployment(name = "myweb", order = 2)
 public static WebArchive createJar() {
     return ShrinkWrap.create(WebArchive.class, "myweb.war")
         .addClass(WildFlyEmbeddedArquillianRunner.class)
         .addClass(ArquillianJndiUtils.class)
         .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
         .addAsManifestResource("jboss-deployment-structure.xml");
 }

 @EJB(lookup = "java:global/myapp/myejbmodule/BusinessServiceBean")
 private BusinessServiceBean ejb;

 @Test
 @OperateOnDeployment("myweb")
 public void sayHello_whenGivenDuke_thenReturnsHelloDuke() {
     assertEquals("Hello duke", ejb.sayHello("duke"));
 }
}
```

There are two deployments: a fictive legacy EAR archive that we want to test (`myapp.ear`). And the test archive (`myweb`). In our real code, not this GitHub example, we had the EAR file deployed before we started the Arquillian tests: we did <u>not</u> have anything resembling the `myapp` deployment. The test class itself bundles a `jboss-deployment-structure.xml` file with the test archive - this file is responsible for  ensuring that the test archive can get access to the classes within the legacy EAR file. Also notice how we inject the BusinessServiceBean using its standardised global JNDI name. We need to do it this way because the component isn't colocated with the test archive itself (it's in the application EAR file).

In our case we were a bit more advanced: we took care of dependency injection into the Arquillian test classes ourselves (on the server side). That allowed us to skip declaring the global JNDI lookup names - _and_ - inject CDI beans as well (we needed to adjust the thread context class loader to make that work. So we tucked it away: to hide it from the test classes). We also added a REST endpoint, to the application EAR file, that could return a list of all its modules (Web and EJB-JAR modules). That information was then used to dynamically build the `jboss-deployment-structure.xml` document instead of having the names hardcoded (as in the GitHub example).

Please realise that this solution is in a territory that is way _outside the Java EE specification_ - and _tightly coupled to WildFly internal functionality_. And there are drawbacks as well: the most obvious one being that the state of the application can be polluted because the business code is not deployed together with the integration test code itself. I guess you can come up with a handful of extra potential problems with this technique too.

Despite any immediate and potential drawbacks - it did solve our problem. And, at least to my knowledge, many valuable integration tests where since introduced using this setup; including tests of security functionality, business functionality, REST service behavior and much more.

I think the biggest take away was this:
<blockquote class="blockquote">We ended up introducing integration tests to our legacy Java EE 7 application.

And even better: we tested the real thing - components in the _actual_ application EAR file.</blockquote>

### Your experience
What about you? Have you had the same problems with introducing Arquillian tests in legacy applications? What solution did you come up with?