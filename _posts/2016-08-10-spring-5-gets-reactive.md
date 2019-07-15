---
layout: post
title: "Spring 5: Gets reactive"
description: "A peek into Spring's reactive future"
date: 2016-08-10
comments: true
tags: java spring reactive-programming
---

Spring 5 is going to include support for the reactive programming model [1].

Here's an example:

```java
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.reactive.WebClient;
import reactor.core.publisher.Mono;

import static org.springframework.web.client.reactive.ClientWebRequestBuilders.get;
import static org.springframework.web.client.reactive.ResponseExtractors.body;

@RestController
public class ReactiveController {

    @RequestMapping("/reactive-controller")
    public Mono<String> sayHello() {
        WebClient reactiveHttpClient = new WebClient(new ReactorClientHttpConnector());
        return reactiveHttpClient
                .perform(get("http://localhost:8080/traditional-controller").accept(MediaType.TEXT_PLAIN))
                .extract(body(String.class));

    }
}
```

Find a working solution <a href="https://github.com/nickymoelholm/smallexamples/tree/master/hello-reactive-spring" target="_blank">at GitHub</a>. It is based on Spring 5 milestone 1 and the current state of the experimental <em>spring-boot-*-web-reactive</em> libraries.

It is much like a normal Spring MVC controller. It is only the return type (<em>Mono</em>) that is different <em>and</em> the fact that the code is non-blocking itself: using the reactive HTTP <em>WebClient</em>.

Clearly, Pivotal believe in this model. And so do Oracle: who will include reactive types into Java 9 [2] that adheres to the Reactive Streams Specification [3]. Vert.x is another framework that is fully based on reactive programming. And there are many other languages and frameworks that supports it. So it seems like this model is here to stay.

#### Reasons for adopting this model
A rather pervasive promise that I have encountered is that reactive applications can exhibit superior performance. They can scale extremely well - apparently only to be limited by the networking capabilities of the underlying platform.

Thats all fine. But we're not all Google, Facebook or Twitter. So to be honest I'm pretty satisfied with the juice that I can get out of the typical non-reactive Web application. But surely, there must be other wins too...

So what is it that makes the reactive model compelling ?

I am not going to pretend to be the expert here. But I've found these interesting remarks about it [4]:
- The scalability of the application is not limited by choices in the application code - nor is it limited by any configuration of the Web container thread pools etc.
- Inversion of control: The responsibility of handling the concurrency has been inverted:  it is <em>no longer the developers responsibility to tune it and get it right</em> - it is entirely handled by the underlying platforms networking/buffering capabilities.

In my opinion that sounds really interesting. Imagine to be able to not care about tuning thread pools in the Web container - or to not care about <em>ExecutorService</em> threadpools tuning in the source code! Just leave it to the machinery below.

#### Potential issues
There's a flipside to this as well [4]: a reactive application is likely more difficult to troubleshoot. And we can shoot ourselves in the foot if we by accident introduce blocking code (fx blocking RDBMS I/O drivers).

Add to that the fact that currently most traditional Java based integration libraries are blocking: so we will have to be creative to make it tick correctly (fx using the <em>blocking-to-reactive</em> pattern).

#### What do you think?
Are there any compelling reasons, other than those mentioned in this post, for us to switch from the imperative programming model into the reactive programming model?

#### References
[1] [Spring 5 Milestone 1 now includes reactive functionality](https://spring.io/blog/2016/07/28/reactive-programming-with-spring-5-0-m1)

[2] [Doug Lea's contribution of reactive types to JDK9](http://hg.openjdk.java.net/jdk9/dev/jdk/file/tip/src/java.base/share/classes/java/util/concurrent/Flow.java)

[3] [The Reactive Streams Specification](http://www.reactive-streams.org/)

[4] Notes from spring.io on reactive programming: [Part 1](https://spring.io/blog/2016/06/07/notes-on-reactive-programming-part-i-the-reactive-landscape), [Part 2](https://spring.io/blog/2016/06/13/notes-on-reactive-programming-part-ii-writing-some-code), [Part 3](https://spring.io/blog/2016/07/20/notes-on-reactive-programming-part-iii-a-simple-http-server-application)