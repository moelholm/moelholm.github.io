---
layout: post
title: "Spring Boot: Enhance your logging"
description: "Using MDC data to get more out the application logs"
date: 2016-08-16
comments: true
---

In this post I show how you can tune your Spring Boot application's logging output - such that it has even more information when you need to troubleshoot. The method is actually so generic that you can apply it to other types of Java applications as well - for example Java EE applications.

### What you have today
Firstly: what is wrong with the default logging we get in Spring Boot? Nothing, actually - but it _can_ be better. As an example, let us consider the log output from a RESTful resource invocation to `/greetings/duke` which returns a plain text greeting:

```code
2016-08-16 21:57:56.269 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingController : Request received. PathVariable is: [duke]
2016-08-16 21:57:56.271 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingRepository : Retrieving standard greeting from the "datastore"
2016-08-16 21:57:56.271 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingService : Formatting greeting for [duke]
```

There are 3 log lines: from `GreetingController`, `GreetingService` `GreetingRepository`. Now imagine a system with 30 simultaneous active users that perform such invocations:

- The log lines would be mixed from the different concurrent threads - making it rather difficult to reason about the sequence of events. The thread names do help us - but even they get reused: the typical web container re-uses the same threads for serving different requests. Effectively meaning that if we filter the logs for, say `o-auto-1-exec-1`, we would get all log lines ever served by that thread.
- It is not possible to relate the log lines to the actual users. We really don't know _which_ user caused _what_ log lines.

### What you can get
This is better:

```code
2016-08-16 22:17:34.408 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingController : Request received. PathVariable is: [duke]
2016-08-16 22:17:34.409 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingRepository : Retrieving standard greeting from the "datastore"
2016-08-16 22:17:34.409 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingService : Formatting greeting for [duke]
```

Here we have the same 3 log lines as before. But this time we can see that they belong to the same HTTP request: the request with id `3e21b7f3-xxxxx`. We can also see that it is the user `tux` that caused these log lines.

The naive solution would be for you to prepend the `userId` and `requestId` to all log lines. But that's never going to happen. You will forget it. If not you - then your colleague. And it can even be difficult to get such information from subcomponents - for example the `GreetingRepository`: how does it know about the `requestId`? Don't even consider using `ThreadLocal`'s now 🙂.

The solution to get such "omni present" logging data is: _Mapped Diagnostic Context (MDC)_. MDC is a feature that is supported in the most modern Java logging frameworks, for example: _Log4j_, _Log4j2_, _Logback_ and more.

If you want to dig further into MDC, then take a look at Logbacks online documentation [1].

### How you get that in Spring Boot
It's easy. First you tell Spring Boot _what_ MDC data to render:
`logging.pattern.level=%X{mdcData}%5p`. Put this in `src/main/resources/application.properties`. Or supply it in any other way supported by the flexible configuration mechanism in Spring Boot. This property tells Spring Boot to render the MDC data variable `mdcData` just before the priority field in the log output. The priority field is the logging level (`DEBUG`, `INFO`, ...) that you are used to see.

Then you maintain the MDC data variable `mdcData` using your logging API - here using SLF4J (over the default Logback provider in Spring Boot):

```java
@Component
public class RequestFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            // Setup MDC data:
            String mdcData = String.format("[userId:%s | requestId:%s] ", user(), requestId());
            MDC.put("mdcData", mdcData); //Variable 'mdcData' is referenced in Spring Boot's logging.pattern.level property 
            chain.doFilter(request, response);
        } finally {
           // Tear down MDC data:
           // ( Important! Cleans up the ThreadLocal data again )
           MDC.clear();
        }
    }
```

Here we maintain the MDC data in a Servlet `Filter`. That is an excellent place to maintain it - if we work with HTTP requests (REST, SOAP, JSP, Servlet, Thymeleaf, ...). If you have JMS listeners in your application - then you'll need to maintain the MDC data there too. Same applies with Quartz Jobs. And so on.

<blockquote class="blockquote">You decide what you want in the MDC data.

Anything goes: URL, session id, request id, user id, ip address, ...</blockquote>

I chose to exemplify the use of MDC data with a user id and an HTTP request id generated when receiving inbound HTTP requests. I like the idea of generating a unique request id (for HTTP, JMS, etc). Especially if you serve it back to the caller's when `Exception`s occur. Given such an ID you can easily find all relevant log output related to that problem. I also like the user id: it easily gives you an overview of what a certain user has been doing in the application. But please decide what works for you - I am certain you can find additional useful data to put in the MDC.

I prepared a [GitHub example](https://github.com/nickymoelholm/smallexamples/tree/master/enhanced-logging) for your convenience - take a look at that for a working example. Or if you just want to look at the above code examples in their full context.

### Not using Spring Boot?
Not using Spring Boot? Then consult your logging frameworks documentation. The entire concept, MDC, is not at all tied to Spring Boot. In fact: MDC existed in Log4j long before Spring Boot was created.

### References
[1] [Logback - Chapter 8: Mapped Diagnostic Context](http://logback.qos.ch/manual/mdc.html)

 