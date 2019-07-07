---
layout: post
title: "Spring Boot: Hello World ,Kotlin"
date: 2017-03-12
---

In this post I show how you can create a Spring Boot 1.5 application using Kotlin 1.1 (as opposed to typically Java 8 in these times).

The example I've created is a typical "Hello World" example. I have chosen to implement a Spring MVC controller - and an awesome Spring Boot integration test. The Gradle build script uses Kotlin as well (that's pretty awesome). You can find the example project in its entirety and real context <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-kotlin-helloworld" target="_blank">on GitHub</a>.

In this post I also explain some of the Kotlin specifics worth noticing to a typical (Spring) Java developer. If you are a Kotlin savvy developer and find that my explanations are wrong or misleading - then please leave a comment, so that I can fix them. I am by no means a Kotlin specialist (yet!).

Just want to see the code?
<h3>1 of 4: The Spring Boot application</h3>
[code language="java"]
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    SpringApplication.run(Application::class.java, *args)
}
[/code]

Notice that we activate Spring Boot using the normal <em>@SpringBootApplication</em> annotation. The fun part here, if you will, is that in Kotlin classes doesn't even need to have a body. I guess many of them will have one - but here it is simply not necessary.

The <em>main</em> method in Kotlin is a package level function (it is not embedded inside a class).

We pass <em>Application::class<strong>.java</strong></em> to the <em>run</em> method. That is not a typo - and it is not a Java source file reference :). It is still the <em>Class</em> object that represents class <em>Application. </em>If you just pass <em>Application::class</em> - then you would pass an object of type <em>KClass</em> - that is Kotlins own representation of what you know as the <em>Class</em> type from Java!

The weird <em><strong>*</strong>args</em> is not a pointer - but rather Kotlins <em>spread</em> operator (the <em>run</em> method declares a vararg parameter).

( Also: Semicolons are not used - no biggie for me though )
<h3>2 of 4: The controller</h3>
[code language="java"]
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
class GreetingController {

 @GetMapping("/hello/{name}")
 fun get(@PathVariable name: String) = "Hello, $name"

}
[/code]

This is a typical Spring MVC controller. I bet you can recognise <em>@RestController, @GetMapping</em> and <em>@PathVariable </em>(if you are an experienced Spring Java developer).

Notice that the function is prefixed with <em>fun</em> here. It looks like a variable assignment, but it isn't. What you see there is an implicit <em>return</em> statement of the string <em>"Hello, $name".</em> The function could have had a body and a <em>return</em> statement instead - but it isn't necessary in this case.

Notice that the the function doesn't have an explicit return type. You could have put "<em>: String</em>" just before the equals sign. But Kotlin can infer it - so not necessary in this case either.

The <em>$name</em> argument is replaced with the contents of the <em>name</em> parameter - a demonstration of Kotlins support for <em>string interpolation</em>. This, almost insignificant feature, would have a huge effect on many of the Java projects I have seen!
<h3>3 of 4: The integration test</h3>
[code language="java"]
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.test.context.junit4.SpringRunner

@RunWith(SpringRunner::class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GreetingControllerIntegrationTests {

    @Autowired
    lateinit var restTemplate: TestRestTemplate

    @Test
    fun `GET when given Duke then returns "Hello, Duke"`() {

        // Given
        val name = "Duke"

        // When
        val body = restTemplate.getForObject("/hello/{name}", String::class.java, name)

        // Then
        assertThat(body).isEqualTo("Hello, $name")

    }

}
[/code]

Worth noticing here is the weird <em>lateinit</em> modifier [lateinit]. So this is the deal: Kotlin normally assume that the member is non-null and therefore it must be assigned explicitly in the constructor to a non-null value. But since the Spring TestContext Framework takes care of the injection after the constructor has run, then we need to allow it explicitly, using the <em>lateinit</em> modifier.

Another interesting element is the <em>@Test</em> function name: I actually started with the name <em>get_whenInvokedWithDuke_thenReturnsHelloDuke</em>. But I updated the example after a recommendation from Tyler (see the comments below): Using backticks around function names allow us to provide sentence-like function names. Super nice for naming tests if you ask me.

In the @Test itself: notice the use of <em>val</em>. It's like Java's <em>final</em> modifier (in context of variables). Kotlin's type inference means that we aren't forced to write down the type (<em>String</em>).

So.... I think this seems super nice. The code is not overly verbose with type information. And at least for this Hello World case I think it is perfectly fine. I'm also pretty happy with the string interpolation again :) ... (in Java land I tend to use <em>String.format("stuff...%s", varhere)</em> - rather annoying).
<h3>4 of 4: The Gradle script</h3>
I have been using Gradle as a drop-in replacement for Maven for the last 1.5 year. For that period I've always used Groovy as the programming language in my Gradle scripts. And I kind of like that - but also, I must admit that the IDE assistance isn't super optimal (even in IntelliJ which I use now).

Then as I was browsing Kotlin features etc, I found out that the Gradle guys are working on supporting Kotlin as another programming language in scripts [gradlekotlin]. And not only that: they are working on making Kotlin the language of choice for developing Gradle plugins [gradlescriptkotlin] !

Okay - the code:

[code language="groovy"]
buildscript {

    val springBootVersion = "1.5.2.RELEASE"
    var kotlinVersion: String by extra
    kotlinVersion = "1.1.0"

    repositories {
        mavenCentral()
    }

    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:$springBootVersion")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
        classpath("org.jetbrains.kotlin:kotlin-allopen:$kotlinVersion")
    }

}

val kotlinVersion: String by extra

apply {
    plugin("kotlin")
    plugin("kotlin-spring")
    plugin("org.springframework.boot")
}

repositories {
    mavenCentral()
}

dependencies {
    compile("org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion")
    compile("org.jetbrains.kotlin:kotlin-reflect:$kotlinVersion")
    compile("org.springframework.boot:spring-boot-starter-web")
    testCompile("org.springframework.boot:spring-boot-starter-test")
}
[/code]

Looks like the ordinary Groovy based script in my opinion. That's nice - so no big re-adjustment.

I am quite certain that you should use an up-to-date version of IntelliJ to get a decent IDE experience with Kotlin based build scripts. For me it seems okay (IntelliJ IDEA 2016.3.5) - but the content assist is extremely slow. I guess that will be nailed properly at some point. Also I still think I get a bunch of weird suggestions in my content assist in the different blocks.
<h3>Motivation: why Kotlin?</h3>
I love Java for it's simplicity - and I know it by heart.

But, to be honest I feel there are a bunch of nice features in most of the other popular languages today that Java simply doesn't have. Kotlin is one of these new JVM languages - and it has a truly remarkable feature list. Head over to the reference manual and browse through it [kotlinreference]; I promise that you will be clapping your hands as you read through the individual features.

Lately I've noticed how Pivotal embraces Kotlin - through examples, public demo sessions (fx by our favorite rockstar, Starbuxman [starbuxman]) and nonetheless by making the core Spring Framework seamless to use from Kotlin [springkotlin]. Being an avid Spring Boot fan that got my attention.

I haven't tried Kotlin on a real world project yet. But I definitely hope that I will get the chance very soon.  

<h3>References</h3>
<em>[kotlinreference] : Kotlin Reference</em>
https://kotlinlang.org/docs/reference/

<em>[starbuxman] : Spring Tips: The Kotlin Programming language</em>
https://spring.io/blog/2016/10/19/spring-tips-the-kotlin-programming-language

<em>[springkotlin] : Introducing Kotlin support in Spring Framework 5.0</em>
https://spring.io/blog/2017/01/04/introducing-kotlin-support-in-spring-framework-5-0

<em>[lateinit]: The Kotlin lateinit modifier:</em>
https://kotlinlang.org/docs/reference/properties.html#late-initialized-properties

<em>[gradlekotlin]: Kotlin Meets Gradle</em>
https://blog.gradle.org/kotlin-meets-gradle

<em>[gradlescriptkotlin]: Gradle Script Kotlin - FAQ</em>
https://github.com/gradle/gradle-script-kotlin/wiki/Frequently-Asked-Questions#in-what-language-should-i-develop-my-plugins

 

 