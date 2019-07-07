---
layout: post
title: "Spring Boot: A bit more cool with Kotlin"
description: "Using Kotlin for your Spring Boot applications"
date: 2017-03-19
---

In the context of my favorite framework, Spring Boot, I have recently started to explore the effect of using the Kotlin 1.1 programming language (as an alternative to Java 8). This post describes a few language features that may be interesting to a typical Java 8 developer. Also, I hope you will see that:

<blockquote>
Spring Boot is a bit more cool with Kotlin
</blockquote>

:)

I have created an example application <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-kotlin-playground" target="_blank">on GitHub</a>. That application contains all the code that you see here. It is based on Spring Boot 2.0 and Kotlin 1.1.

The example contains: a JPA entity, a JPA repository, a REST controller, a REST client and 2 x integration tests. The database is H2 and the schema is created using a single Flyway migration.

It is going to get messy now: I'll just pick and choose Kotlin features, in the context of that example, that I find interesting. Hang tight :)

<h3>JPA - Kotlin style</h3>
Here's the JPA entity:
[code language="java"]
import javax.persistence.Entity
import javax.persistence.Id
import javax.validation.constraints.NotNull

@Entity
class Message(@Id val id: String, @NotNull val text: String)
[/code]
A one liner. It has two properties: <em>id</em> and <em>text</em>. It uses standard JPA annotations. So that's one of Kotlin's nice features: <em>properties</em> - see [kotlin-reference]. Another, is the possibility to develop extremely compact class definitions.

A JPA repository that can be used to perform CRUD operations on the entity:
[code language="java"]
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MessageRepository : JpaRepository<Message, String>
[/code]
This is a Spring Data powered JPA repository in action. To be honest it's quite similar to the same if it was written Java. Just wanted to show it for completeness. 
<h3>REST controller - Kotlin style</h3>
[code language="java"]
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.annotation.PostConstruct

@RestController
@RequestMapping("/messages")
class MessageController(val messageRepository: MessageRepository) {

    @PostConstruct
    fun postConstruct() = messageRepository.save(
            listOf(Message("1", "Hello World"), Message("2", "Hej Verden")))

    @GetMapping
    fun list() = messageRepository.findAll()

    @GetMapping("/{id}")
    fun get(@PathVariable id: String) = messageRepository.findOne(id)

}
[/code]
This is a normal Spring MVC REST controller. It uses constructor injection (see the class header), defines two HTTP GET methods and a lifecycle method. 

The methods are one liners: In Kotlin, functions doesn't have to supply a body.  

Notice that the methods doesn't explicitly declare any return types. That's an example of Kotlin's advanced type inference. You are definitely allowed to declare the types also. Being a die hard Java developer, I may argue that it could add clarity to the reader - but mostly for more advanced examples (fx functions with bodies having x amount of code). 

Together these features reduce the typical Java ceremonies a lot.

<h3>REST client - Kotlin style</h3>
Here's a rather funny REST client (it's just a client to the controller you saw above):
[code language="java"]
import kotlinx.coroutines.experimental.CommonPool
import kotlinx.coroutines.experimental.async
import kotlinx.coroutines.experimental.runBlocking
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

@Component
class MessageClient(templateBuilder: RestTemplateBuilder, @Value("\${server.port}") val port: Int) {

    val restTemplate = templateBuilder.rootUri("http://localhost:$port").build()

    fun getMessages(): List<Message> {

        fun asyncGetForObject(id: Int) = async(CommonPool) {
            TimeUnit.SECONDS.sleep(4)
            restTemplate.getForObject("/messages/$id/", Message::class.java)
        }

        val messages = listOf(asyncGetForObject(1), asyncGetForObject(2))

        return runBlocking { messages.map { it.await() } }

    }

}
[/code]
This class has two properties: <em>port</em> and <em>restTemplate</em>. The latter is initialized in the class body. Take a look at that initialization code: it uses Kotlin's string template support for string interpolation [kotlin-stringtemplates]. I know it's small stuff - but thats really a neat little feature. Also - you know what? Kotlin even supports multiline strings :)

Take a close look at the <em>getMessages</em> function. It has a nested function called <em>asyncGetForObject</em>. At first this may seem nasty to a Java developer. But to be honest, after having given it a bit of thought, I think it <em>can</em> be okay. In this case I think it is, because: the function is only supposed to be used from within the <em>getMessages</em> function <em>and</em> it is rather small. 

Also, <em>getMessages</em> uses the Kotlin 1.1 experimental "coroutine" functionality [kotlin-coroutines]. The coroutine is the <em>async(CommonPool){}</em> block. Invoking that, as we do twice in the <em>val messages = ...</em> line is non-blocking (hence the <em>async</em> hint :)). At that very moment 2 x REST requests run in parallel. The last block <em>runBlocking{}</em> is where we await the results and return them when they are ready.

There is a lot more to the coroutine story. And remember it is experimental in Kotlin 1.1. But still: That's damn interesting in my opinion :).

Did you notice the collection map functionality?? The <em>messages.map { it.await() }</em> code. (We pass a lambda to the <em>List.map()</em> method). In Kotlin single-argument lambdas, we can just reference the <em>it</em> variable. Also, no <em>collect()</em> call there. That's a really nice lambda functionality in Kotlin, right? :)

<h3>Tests - Kotlin style</h3>
Here's a Spring Boot integration test of the REST client:
[code language="java"]
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment.DEFINED_PORT
import org.springframework.test.context.junit4.SpringRunner
import kotlin.system.measureTimeMillis

@RunWith(SpringRunner::class)
@SpringBootTest(webEnvironment = DEFINED_PORT, value = "server.port=8090")
class MessageClientIntegrationTests {

    @Autowired
    lateinit var messageClient: MessageClient

    @Test
    fun `getMessages() should fetch messages in parallel`() {

        val durationInMilliseconds = measureTimeMillis {

            val messages = messageClient.getMessages()

            assertThat(messages.size).isEqualTo(2)
            assertThat(messages).extracting { it.id }.contains("1", "2")
            assertThat(messages).extracting { it.text }.contains("Hello World", "Hej Verden")

        }

        assertThat(durationInMilliseconds).isLessThan(5000)

    }

}
[/code]
The test function name is more pleasant to read than a typical Java based test. 

Notice Kotlin's <em>measureTimeMillis</em> function. For Java developers that may look like a build in language construct. Like the Java <em>synchronized( this ) {}</em> blocks fx. It is a function actually: In Kotlin, when a lambda is the <u>last</u> argument, then it may be supplied after the function call (<em>measureTimeMillis() {}</em> or <em>measureTimeMillis {}</em>). 

The <em>measureTimeMillis</em> function itself - that's not bad at all either I think. Here it is super handy and nevertheless easy to use.

There are many more cool features in Kotlin. That's subject for another post though.

I told you it was going to get messy :)

<h3>References</h3>
<em>[kotlin-reference] : Kotlin Reference</em>
https://kotlinlang.org/docs/reference/

<em>[kotlin-coroutines] : Kotlin Reference : Coroutines</em>
https://kotlinlang.org/docs/reference/coroutines.html

<em>[kotlin-stringtemplates] : Kotlin Reference : String templates</em>
https://kotlinlang.org/docs/reference/basic-types.html#string-templates

