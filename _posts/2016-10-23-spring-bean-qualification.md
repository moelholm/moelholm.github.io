---
layout: post
title: "Spring: Bean qualification"
description: "Handling the situation where multiple beans qualifies for an injection point"
date: 2016-10-23
---

In this post I present how you can control a situation in which there are multiple beans that qualifies for an injection point in Spring.

The material here has been tested with Spring Framework 4.3.
<h3>The problem</h3>
Let's first take a look at the problem. Imagine you have this interface:

[code language="java"]
public interface BusinessEventLogger {
}
[/code]

And two different implementations of this. First this:

[code language="java"]
@Repository
public class DatabaseBusinessEventLogger implements BusinessEventLogger {
}
[/code]

And then this:

[code language="java"]
@Repository
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
[/code]

Now, when you try to inject by the interface...

[code language="java"]
@Service
public class GreeterService {

  @Autowired
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
[/code]

... then Spring will fail with a <em>NoUniqueBeanDefinitionException</em>. That is because Spring cannot decide which repository implementation is appropriate. After all, there are two equally valid bean candidates here.

Techniques that you can use to get back in control:
<ul>
	<li>Static decisions:
<ul>
	<li>Use the bean class</li>
	<li>Use the injection target member name</li>
	<li>Use the <em>@Qualifier</em> annotation</li>
	<li>Use a custom qualifier annotation</li>
	<li>Use <em>@Primary</em></li>
</ul>
</li>
	<li>Runtime decisions:
<ul>
	<li>Use <em>@Profile</em></li>
	<li>Use <em>@Profile</em> and<em> @Primary</em></li>
</ul>
</li>
</ul>
That should be enough to get you started. Notice the grouping. Some of the techniques require you at development time to know which bean is relevant. Other techniques allow you to defer the decision until runtime. The latter group is appropriate if the actual decision is environment specific for example.

I have prepared an example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/spring-beanqualification" target="_blank">on GitHub</a> that shows the problem and each of the solutions. It is based on Spring Framework 4.3 (via Spring Boot 1.4.1). And it is a multi module Gradle project. The problem scenario itself is illustrated in module <em>00_TheProblem</em>. The solution scenarios are illustrated in the modules named something similar to <em>0x_TheSolution_abc.</em>
<h3>Solution 01: Use the bean class</h3>
This technique is applicable if you, at <span style="text-decoration:underline;">development time</span>, already know the specific bean you need:

[code language="java"]
@Service
public class GreeterService {

  @Autowired
  private WebServiceBusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
[/code]

Notice that the class <em>WebServiceBusinessEventLogger</em> has been hardcoded here.
<h3>Solution 02: Use the injection target member name</h3>
This technique is applicable if you, at <span style="text-decoration:underline;">development time</span>, already know the specific bean you need:

[code language="java"]
@Service
public class GreeterService {

  @Autowired
  private BusinessEventLogger webServiceBusinessEventLogger;

  public String sayHello(String caller) {
    webServiceBusinessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
[/code]

Notice the name of the member field being injected into: <em>webServiceBusinessEventLogger</em>. This name happens to match the bean name of the bean that  is-a <em>WebServiceBusinessEventLogger</em>.

A bit fragile huh? One day another developer may drop by and refactor the name to something else. If that happens - then the application won't start anymore.
<h3>Solution 03: Use @Qualifier</h3>
This technique is applicable if you, at <span style="text-decoration:underline;">development time</span>, already know the specific bean you need:

[code language="java"]
@Service
public class GreeterService {

  @Autowired @Qualifier("webServiceBusinessEventLogger")
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
[/code]

Notice the use of Spring's <em>@Qualifier</em> annotation. It tells Spring exactly which bean is needed - by specifying its name.

I think this solution is more robust than solution 02. But it is still a bit fragile. What if somebody decides to refactor the name of the <em>WebServiceBusinessEventLogger</em> class?
<h3>Solution 04: Use a custom qualifier annotation</h3>
This technique is applicable if you, at <span style="text-decoration:underline;">development time</span>, already know the specific bean you need:

[code language="java"]
@Service
public class GreeterService {

  @Autowired @WebServiceStrategy
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
[/code]

Notice the use of the <em>@WebServiceStrategy</em> annotation. This is a custom qualifier annotation. It tells Spring what bean is used. To make this work though, you first have to define the annotation:

[code language="java"]
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
public @interface WebServiceStrategy {
}
[/code]

(Notice the use of Spring's<em> @Qualifier </em>here. Now it is being used as a meta-annotation)

And you will also have to add it to the bean:

[code language="java"]
@Component
@WebServiceStrategy
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
[/code]

You also need to do the same for the database logger.

This solution is as type safe as it gets. But at the expense of additional ceremony. It can make sense, if the abstraction of the qualifier annotation names is good enough.
<h3>Solution 05: Use @Primary</h3>
This technique is applicable if you, at <span style="text-decoration:underline;">development time</span>, already know the specific bean you need. You put Spring's <em>@Primary</em> annotation on the "primary" bean:

[code language="java"]
@Component
@Primary
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
[/code]

This will make the <em>WebServiceBusinessEventLogger</em> bean "win".

Notice the difference from the previous solutions:
<blockquote>Using Spring's @Primary annotation on a bean is a global decision: every injection point will get the chosen bean.</blockquote>
This may seem like a weird solution. And in production code - using it like this - perhaps it is. But this is not where <em>@Primary</em> shines. Rather:
<blockquote>The @Primary bean feature is interesting when used together with @Profile to activate the primary bean at runtime.

OR:

The @Primary bean feature is interesting when used for testing purposes.</blockquote>
If you haven't thought about this before, then now is the time to read that again :).

For testing purposes you can use <em>@Primary</em> to make a test bean "win" over a business bean. Take a look at Baeldung's article for further inspiration [1]. In that article <em>@Primary</em> is used with a <em>@Bean</em> factory method and <em>@Profile</em> to make a test bean have precedence over a business bean. <em>@Profile</em> for this scenario isn't necessary - <span style="text-decoration:underline;">unless</span> the test bean also gets picked up when you run the application normally. That is typically an IDE configuration issue: when your test <em>*.class</em> files are colocated with the normal business <em>*.class</em> files (I've seen that in Eclipse once or twice).
<h3></h3>
<h3>Solution 06: Use @Profile</h3>
This technique is applicable if you want to choose the bean at runtime.

If you are using Spring Boot you could, as an example, start the application with:
<pre><em>--spring.profiles.active=webservice </em></pre>
... to activate the <em>webservice</em> profile. Or you could also do it from a test, like this:

[code language="java"]
@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("webservice")
public class GreeterServiceIntegrationTests {
}
[/code]

Notice the use of <em>@ActiveProfiles</em> - that tells Spring to run the ApplicationContext with the <em>webservice</em> profile activated.

In order for this to work, you also need to tell the conflicting beans what profile they belong to. You use the <em>@Profile</em> annotation for that. Here's how you would do it for the <em>WebServiceBusinessEventLogger</em> class:

[code language="java"]
@Component
@Profile("webservice")
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
[/code]

Notice <em>@Profile</em>. That annotation tells Spring to only add the bean to the <em>ApplicationContext</em> if the <em>webservice</em> profile is active. <em>@ActiveProfiles</em> is different: it's a test specific annotation that you put on test classes to tell Spring what profiles to activate when running the tests.

Unless you do anything else: You still need to put the <em>@Profile</em> annotation on the database logger too. Otherwise there will still be a conflict when you run with the <em>webservice</em> profile active (since, now there are two active beans candidates). If you have more candidates - then you will have to put <em>@Profile</em> on them too.
<h3>Solution 07: Use @Profile and @Primary</h3>
This technique is applicable if you want to choose the bean at runtime. It is 90% similar to solution 06. But this solution doesn't require you to put<em> @Profile</em> on all candidates - only on the one that you also choose to be <em>@Primary</em>:

[code language="java"]
@Component
@Profile("webservice")
@Primary
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
[/code]

That's it. Nothing else. If you have more candidates - then you will have to put <em>@Profile</em> and <em>@Primary</em> on them too.

The difference to solution 06, is that in this solution, one bean acts as a default bean: namely the one without <em>@Profile</em>.
<h3>Conclusion</h3>
This post described different techniques to solving the situation where you have multiple bean candidates for an injection point. Some of them are appropriate if you can make the decision at development time. Others are appropriate if you would like the flexibility at runtime. All of them have been possible since Spring Framework 3.x.

I haven't included:
<ul>
	<li>XML examples</li>
	<li>Standards based qualification examples (JSR330 standard annotations [2])</li>
	<li><em>@Bean</em> examples</li>
</ul>
They do provide some further alternatives to fulfil the mission. That is an exercise for the motivated reader :).

I would love to hear from you, if you believe that I have forgotten some other obvious techniques. Just leave a comment before you leave.
<h3>References</h3>
[1] Injecting Mockito Mocks into Spring Beans :
<a href="http://www.baeldung.com/injecting-mocks-in-spring" target="_blank">http://www.baeldung.com/injecting-mocks-in-spring</a>

[2] What is the relation between JSR-299 and JSR-330 in Java EE 6? Do we need two DI APIS?:
<a href="http://www.adam-bien.com/roller/abien/entry/what_is_the_relation_between" target="_blank">http://www.adam-bien.com/roller/abien/entry/what_is_the_relation_between</a>