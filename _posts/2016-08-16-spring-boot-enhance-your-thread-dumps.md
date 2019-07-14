---
layout: post
title: "Spring Boot: Enhance your thread dumps"
description: "Adding extra information to your applications' thread dumps"
date: 2016-08-16
---

In this post I show how you can add extra information to your applications' thread dumps.

I will use Spring Boot as an example environment - but the idea is very generic: You can, for example, easily apply this technique to any other Java EE application server environment you may have. Here is an example of an enhanced thread dump output (out of context and heavily edited) from the `/dump` tool in a Spring Boot application (JSON format):

```javascript
{
    threadName: "http-nio-8080-exec-1_[started:2016-08-15T22:38:04.275+02:00 | user:johndoe | uri:/slowgreetings/duke]_http-nio-8080-exec-1",
    threadId: 24,
    // ... and so on and so forth
    blockedCount: 0
}
```

_( You will see the same information in the thread dumps you take by any other means - for example using the JDK jstack tool)_

Notice the `threadName`: normally that would only show `http-nio-8080-exec-1`. But here it additionally shows:

- uri: The HTTP request URI being processed by the thread
- started: The date and time at which the request was received
- user: The user principal who is executing the request

I like these 3 pieces of information when I'm debugging a production problem where the application seems to "hang". You can put anything that you want into the thread name as well - these are just some ideas for your inspiration.

To get such enhanced thread dumps you will need to modify the thread names temporarily. The above example is relevant when the JVM is receiving inbound HTTP client requests. So in that case you will need to update the thread name as early as possible upon receiving a request. But you could also add Quartz job information instead when jobs start. Or JMS information when you receive messages. Or whatever you can imagine.

### Spring Boot code example
I have prepared a super simplistic example [on GitHub](https://github.com/nickymoelholm/smallexamples/tree/master/enhanced-threaddumps).

It is a Spring Boot application that exposes a single REST endpoint that you can poke from the browser (accepts a simple GET request). In addition to that endpoint I've also included a Servlet `Filter`. This is where I add the enhanced thread information:

```java
 public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
     String threadName = Thread.currentThread().getName();
     try {
         Thread.currentThread().setName(String.format(
             "%1$s_[started:%2$s | user:%3$s | uri:%4$s]_%1$s",
             threadName, timeNow(), user(), uri(request)));
         chain.doFilter(request, response);
     } finally {
         Thread.currentThread().setName(threadName);
     }
 }
```

There is really no magic here. Just modify the thread name with whatever information you can imagine. Don't forget to reset the name in a finally block (so that the information belonging to a certain request doesn't accidentally survive to another request).

In fact, since this is an ordinary Servlet `Filter`: you can take this recipe directly to your Java EE application as well. If you are using another stack: I bet you can find a similar "single point of entry" where you can place the functionality. Otherwise consider upgrading to Spring Boot ;).

Do you know why I prepended _and_ appended the original thread name to the modified name? I appended the name so that it still appears in the Spring Boot console output (otherwise we would only see the last part of the thread name: which is the extra information we have added). And I prepended it - so that it is still the first thing you see in the thread dumps.
