---
layout: post
title: "Java EE: Hello World, Kotlin"
description: "Using Kotlin for your Java EE applications"
date: 2017-03-16
comments: true
tags: java javaee ejb kotlin jax-rs arquillian integration-test
---

Are you a savvy Java EE 7 application developer? My bet is then, that you are using Java 7/8 for developing your favorite components (EJBs, CDI beans etc). In this post I am going to show how you can develop a Java EE 7 application using Kotlin 1.1 instead. It is very very (!) easy: leverage your existing Java EE 7 knowledge while learning one of the most powerful and beautiful JVM languages we have right now. Very opinionated of course 😉

The example code in this post can be found in its entirety and real context <a href="https://github.com/moelholm/smallexamples/tree/master/javaee7-kotlin-helloworld" target="_blank">on GitHub</a>.

The application consists of the following: an EJB, a JAX-RS resource, two arquillian integration tests and a Gradle script. CDI is used - but only for injecting the EJB into the JAX-RS resource. Everything is fuelled by a WildFly 10.1 application server. Not WildFly Swarm; vanilla Java EE 7 here. 

Just want to see the code?

### 1 of 4: The EJB

```kotlin
import javax.ejb.Stateless

@Stateless
class HelloBean {

    fun sayHello(caller: String) = "Hello, $caller"

}
```

This is a stateless session bean with a "no-interface" view.

It has a single method: `sayHello`. Kotlin can infer the return type here from the expression: an ordinary `String`. Also note how Kotlin offers string interpolation - the `caller` parameter is seamlessly used in the message: No `String.format("Hello, %s", caller)` necessary anymore. 

Are you wondering about the weird method syntax? It looks like a variable assignment perhaps? Well, in Kotlin, a method (or function) may or may not have a body. If it doesn't have a body, then you use the "=" character and specify the `return` value directly. If you do provide a body...then it will look much like traditional Java code.

No semicolons 🙂.

### 2 of 4: The JAX-RS resource

```kotlin
import javax.inject.Inject
import javax.ws.rs.GET
import javax.ws.rs.Path
import javax.ws.rs.PathParam

@Path("/hello")
class HelloResource @Inject constructor(val helloBean: HelloBean) {

    @GET
    @Path("/{caller}")
    fun get(@PathParam("caller") caller: String) = helloBean.sayHello(caller)

}
```

A bit weird 🙂. But awesome when your synapses start to learn what it means. 

Class `HelloResource` is a JAX-RS resource that has a `primary` constructor [kotlin-primaryconstructor] and a property: `helloBean`. It's part of the class header. Normally you wouldn't write `constructor` in the class header. But when you want to apply an annotation to it...then it becomes mandatory. The annotation used here, is the CDI `@Inject` annotation.

In short: `HelloResource` uses CDI to perform "constructor injection" in order to obtain a reference to the `HelloBean` EJB. You can also do field injection etc. - but that's for your own exercise 🙂

The JAX-RS resource defines a single method that responds to "HTTP GET" requests: `get(...)`. Notice how the JAX-RS annotations are used as you are used to from Java.

Before the resource is deployed in the application server, recall that in Java EE 7, you need to wrap up the trivial JAX-RS Application as well:

```kotlin
import javax.ws.rs.ApplicationPath
import javax.ws.rs.core.Application

@ApplicationPath("/api")
class HelloJaxRsApplication : Application() {

    override fun getClasses() = mutableSetOf(HelloResource::class.java)

}
```

Kotlin inheritance right there! In Kotlin you use ":" for covering the typical Java `extends` and `implements` keywords. 

Take a look at the `getClasses` method: it uses the `mutableSetOf` function. What's up with that?

Well, in Kotlin you can have package level functions - functions that don't live in a class. Some functions, such as `mutableSetOf`, is visible to you without the need for importing them. Just like you can use `java.lang.*` in Java land. 

### 3 of 4: The Arquillian integration tests

An integration test of the EJB:

```kotlin
import org.jboss.arquillian.container.test.api.Deployment
import org.jboss.arquillian.junit.Arquillian
import org.jboss.shrinkwrap.api.ShrinkWrap
import org.jboss.shrinkwrap.api.asset.EmptyAsset
import org.jboss.shrinkwrap.api.spec.WebArchive
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import javax.inject.Inject
import kotlin.reflect.KClass

@RunWith(Arquillian::class)
class HelloBeanIntegrationTests {

    @Inject
    lateinit var helloBean: HelloBean

    @Test
    fun sayHello_whenInvokedWithDuke_thenReturnsHelloDuke() {

        // Given
        val caller = "Duke"

        // When
        val message = helloBean.sayHello(caller)

        // Then
        assertEquals("Hello, Duke", message)

    }

    companion object {

        @JvmStatic
        @Deployment
        fun createDeployment() = ShrinkWrap.create(WebArchive::class.java)
                .addPackage(HelloBean::class.java.`package`)
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsLibraries(File(KClass::class.java.protectionDomain.codeSource.location.file))

    }

}
```

Notice the injection of `helloBean`: Keyword `var`. Properties declared like this are mutable - you can change them at will in your code. Kotlin also offers `val`. This is like using the `final` modifier in Java: you can only set them once. 

In this case we are forced to use the `val` keyword because Arquillian performs dependency injection of the `helloBean` field, `after` the class has been constructed. For that to work we also need to use Kotlin's `lateinit` modifier. Without it the code wouldn't compile. You may find it overly annoying here. But you will probably be happy to hear that it is caused by another Kotlin feature that is insanely cool: Kotlin offers null safety [kotlin-nullsafety].

The actual `@Test` method itself: Not much to say here. It's the ordinary <b>server-side</b> Arquillian test. When executed, then it runs inside the application server process.

In Java, Arquillian needs a static method annotated with `@Deployment` that produces a Java EE archive (EAR, JAR or WAR) containing the components to be tested. Kotlin doesn't have `static` methods at all - so that's a problem. Luckily Kotlin offers companion objects [kotlin-companionobjects] and the `@JvmStatic` annotation [kotlin-jvmstatic]. Suffice to say: This cocktail solves the Java interoperability "issue" without further ado. Arquillian cannot tell the difference 🙂

Notice the library being added to the Arquillian archive: We need to bundle some Kotlin runtime classes with the application. What you see in this example, is a good old dirty Java trick allowing you to locate the actual JAR file from which the specified class is loaded. Perhaps you can find a Shrinkwrap Gradle/Maven resolver for a more viable alternative [shrinkwrap-resolver]. 

A <b>client-side</b> integration test of the JAX-RS resource:

```kotlin
import org.jboss.arquillian.container.test.api.Deployment
import org.jboss.arquillian.container.test.api.RunAsClient
import org.jboss.arquillian.junit.Arquillian
import org.jboss.arquillian.test.api.ArquillianResource
import org.jboss.shrinkwrap.api.ShrinkWrap
import org.jboss.shrinkwrap.api.asset.EmptyAsset
import org.jboss.shrinkwrap.api.spec.WebArchive
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.net.URI
import javax.ws.rs.client.ClientBuilder
import kotlin.reflect.KClass

@RunWith(Arquillian::class)
class HelloResourceIntegrationTests {

    @ArquillianResource
    lateinit var url: URI

    @Test @RunAsClient
    fun get_whenInvokedWithDuke_thenReturnsHelloDuke() {

        // Given
        val caller = "Duke"

        // When
        val message = ClientBuilder.newClient().target(url)
                .path("/api/hello/$caller")
                .request()
                .get(String::class.java)

        // Then
        assertEquals("Hello, Duke", message)

    }

    companion object {

        @JvmStatic
        @Deployment
        fun createDeployment() = ShrinkWrap.create(WebArchive::class.java)
                .addPackage(HelloResource::class.java.`package`)
                .addAsManifestResource(EmptyAsset.INSTANCE, "beans.xml")
                .addAsLibraries(File(KClass::class.java.protectionDomain.codeSource.location.file))

    }

}
```

Kotlin-wise, not so much to remark.

The test is an Arquillian client side test. That is enforced via the `@RunAsClient` annotation on the test method. 

Also, I thought it could be fun to use the JAX-RS client side API to test the resource. So that's what you see there: Vanilla Java EE API use.

### 4 of 4: The Gradle script
Many Java EE developers are happy Maven users. I have been so too for years. Today I am a happy Gradle user. So for this example, I have used Gradle to take care of the build, packaging and dependency management:

```groovy
buildscript {
    ext {
        kotlinVersion = '1.1.1'
        wildflyVersion = '10.1.0.Final'
        wildflyHome = "${rootDir}/build/unpacked/dist/wildfly-${wildflyVersion}"
    }
    repositories {
        mavenCentral()
        jcenter()
    }
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
        classpath "org.jetbrains.kotlin:kotlin-allopen:$kotlinVersion"
        classpath "org.jetbrains.kotlin:kotlin-noarg:$kotlinVersion"
    }
}

configurations {
    install
}

apply plugin: 'java'
apply plugin: 'kotlin'
apply plugin: "kotlin-allopen"
apply plugin: "kotlin-noarg"
apply plugin: 'war'

allOpen {
    annotation("javax.ejb.Stateless")
    annotation("javax.ws.rs.Path")
}

noArg {
    annotation("javax.ws.rs.Path")
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

repositories {
    mavenCentral()
    maven { url 'https://repository.jboss.org/nexus/content/groups/public-jboss' }
    maven { url 'https://repository.jboss.org/nexus/content/repositories' }
    maven { url 'https://repository.jboss.org/nexus/content/repositories/thirdparty-releases' }
}

dependencies {
    providedCompile 'javax:javaee-api:7.0'

    compile("org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion")
    compile("org.jetbrains.kotlin:kotlin-reflect:$kotlinVersion")

    testCompile 'junit:junit:4.12'
    testCompile 'org.jboss.arquillian:arquillian-bom:1.1.12.Final'
    testCompile 'org.jboss.arquillian.junit:arquillian-junit-container:1.1.12.Final'

    testRuntime "org.wildfly.arquillian:wildfly-arquillian-container-managed:2.0.2.Final"
    testRuntime 'org.jboss.logging:jboss-logging:3.1.4.GA'
    testRuntime 'org.jboss.resteasy:resteasy-client:3.1.1.Final'

    install "org.wildfly:wildfly-dist:${wildflyVersion}@zip"
}

test {
    environment 'JBOSS_HOME', rootProject.wildflyHome
    systemProperty 'java.util.logging.manager', 'org.jboss.logmanager.LogManager'
}

task unzipWildFlyAppServer(type: Copy) {
    from zipTree(configurations.install.singleFile)
    into file("${buildDir}/unpacked/dist")
    tasks.test.dependsOn unzipWildFlyAppServer
}
```

To build Kotlin source code you need the Gradle "kotlin" plugin. You apply that as with the normal "java" plugin. 

In Kotlin, classes are per default "final" (in Java terminology). But the Java EE application server vendor needs to subclass our components in order to provide security, transaction support, threadsafety, scope management and much more. You could write "open" in front of all your Kotlin classes. But the Kotlin guys have made us an offer we cannot refuse: the `kotlin-allopen` compiler plugin. It is declared in the `buildscript{}` block - and used in the `allOpen{}` block: simply list the standard Java EE annotations (or your own custom ones) that should trigger a class to be "open" (meaning that it can be inherited from by another class).

Some Java frameworks wants a noarg constructor in Java classes. JAX-RS resources must provide one as well. But recall the example code: there isn't one. Because we use CDI to perform constructor injection of the EJB. Again, Kotlin comes with another compiler plugin: `kotlin-noarg`. In the `noArg{}` block we list those annotations that should trigger classes to always have a noarg constructor. So, basically the same as for the allopen functionality.

In addition to that, don't forget to add the `kotlin-stdlib` and `kotlin-reflect` Kotlin libraries to the compile classpath.

Sidetrack: The `unzipWildFlyAppServer` Gradle task has nothing to do with Kotlin. It just ensures that WildFly AS 10.1 is downloaded and extracted - so that it can be used from the Arquillian tests.

### Conclusion
I haven't even shown all the cool Kotlin language features in this post. There are many many super cool features that Kotlin offers you. Fx _properties, default parameter values, named parameters, data classes (!!), extension functions_ and much more. 

But I hope that I succeeded in showing you how to use Kotlin with Java EE. I feel that it is largely painless. There are a few interoperability tricks that we need to perform - but I guess they become "the usual suspects". 

You can use this new modern language right now. But you don't have to switch paradigm, leave the JVM - heck; you can even continue mastering your favorite Java framework. Here, in this post, I showcased Java EE 7. But the same applies for Spring Framework applications (Spring Boot flavors also), Vert.x applications and much more.

At the time of writing this post I haven't adopted Kotlin on real-world projects (on the job). But it is very likely to happen on the next.

You can wait for Java to adopt modern programming language features. Or you can use Kotlin right now. A little flirt with Kotlin doesn't mean you are divorcing Java 🙂

### References

[kotlin-primaryconstructor] [Kotlin Reference : Constructors](https://kotlinlang.org/docs/reference/classes.html#constructors)

[kotlin-nullsafety] [Kotlin Reference : Null safety](https://kotlinlang.org/docs/reference/null-safety.html)

[kotlin-companionobjects] [Kotlin Reference : Companion objects](https://kotlinlang.org/docs/reference/classes.html#companion-objects)

[kotlin-jvmstatic] [Kotlin Reference : Generating REAL static methods](https://kotlinlang.org/docs/reference/java-to-kotlin-interop.html#static-methods)

[shrinkwrap-resolver] [Shrinkwrap Resolvers](https://github.com/shrinkwrap/resolver)

