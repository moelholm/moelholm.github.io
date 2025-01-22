---
layout: post
title: "Spring Boot: Show all logging events for one Web request only"
description: "How to trigger TRACE logging for selected HTTP requests"
date: 2016-08-24
comments: true
tags: java spring spring-boot logging trace http-request
---

In this post I show how you _for a single Web request_ can make your Spring Boot application dump _all_ log statements on all categories (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`). Everything - but only for the specific Web request that you care about. I show the technique using Spring Boot 1.4. 

Here's an example. Imagine a call to:
<pre>http://localhost:8080/greetings/duke<strong>?trace=<span style="color:#339966;">on</span></strong></pre>
The `trace` query parameter is completely unknown to the actual `GreetingController`. But it instructs your application to log everything related to that request:

<img src="/img/2016-08-24-logevents.png" class="w-100 pl-2 pr-2" />

With this amount of information you can go ahead and troubleshoot those hard to understand production issues! Compare that to what you will get without the trace support:

<img src="/img/2016-08-24-logevents-2.png" class="w-100 pl-2 pr-2" />

The best thing: once you have implemented support for the `trace` query parameter, you can use it on `any` Web request to your application: Servlets, JSP's, SOAP endpoints, REST endpoints and so on. In fact: they don't even know about it.

### Spring Boot implementation
I have prepared a [GitHub example](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-logging-threadspecific) - consult that to see all source code in its entirety and full context. 

Here is what you need to do:

- Create a `ThreadLocal`(ish) object that knows when everything should be logged
- Create a Web filter that manages this `ThreadLocal`(ish) object
- Hook into the logging provider so that it can use the `ThreadLocal`(ish) object to decide wether or not to log a logging event

Spring Boot's default logging provider is Logback. So I have used that in this example when implementing step three. Here it goes.

#### Step 1 of 3: Class ThreadLoggingSupport

```java
public class ThreadLoggingSupport {

    private static final Map<Long, Boolean> THREAD_TO_ENABLED = new HashMap<>();

    public static void logEverything(boolean enabled) {
        THREAD_TO_ENABLED.put(Thread.currentThread().getId(), enabled);
    }

    public static boolean shouldLogEverything() {
        return Optional.ofNullable(THREAD_TO_ENABLED.get(Thread.currentThread().getId()))
                .orElse(false);
    }

    public static void cleanup() {
        THREAD_TO_ENABLED.remove(Thread.currentThread().getId());
    }
}
```

The purpose of this class is to allow code in the Web layer (next step) to communicate with the logging system (step 3). 

(I deliberately chose not to use a `ThreadLocal` here: since the use of it in step 3 would have made it bind to all threads that uses Logback - and not only the Web container threads.)

#### Step 2 of 3: Class ThreadLoggingFilterBean

```java
@Component
public class ThreadLoggingFilterBean extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            boolean logEverythingForThisRequest = "on".equalsIgnoreCase(request.getParameter("trace"));
            ThreadLoggingSupport.logEverything(logEverythingForThisRequest);
            chain.doFilter(request, response);
        } finally {
            ThreadLoggingSupport.cleanup();
        }
    }

}
```

This is an ordinary Spring `GenericFilterBean`. All Web requests goes through this filter. Notice how it pulls out the `trace` query parameter value. If it has the value `on` then it will tell the log system to go nuts - logging everything it receives.

#### Step 3 of 3: Class ThreadLoggingInitializer

```java
@Component
public class ThreadLoggingInitializer {

    private static org.slf4j.Logger LOG = LoggerFactory.getLogger(ThreadLoggingInitializer.class);

    @EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
        LoggerContext loggerContext = ((Logger) LoggerFactory.getLogger("")).getLoggerContext();
        loggerContext.addTurboFilter(new TurboFilter() {
            @Override
            public FilterReply decide(Marker marker, Logger logger, Level level, String format, Object[] params, Throwable t) {
                return (ThreadLoggingSupport.shouldLogEverything()) ? FilterReply.ACCEPT : FilterReply.NEUTRAL;
            }
        });
        LOG.info("ThreadLogging support initialized");
    }
}
```

This is where we enter Logback specifics: We register a global log filter (a `TurboFilter`) that knows when to:

- Force the logging of a specific logging event, or
- Ignore the specific logging event

All logging events go through this filter - so it is important to avoid putting expensive code here.

Here we simply check the `ThreadLocal`(ish) state and use that to decide wether the current logging event should be logged or ignored. Ignoring it here means that this filter wont interfere in the decision. For more information about Logback and its filter support, refer to the online manual [1].

### Closing remarks
Here I used Web requests as an example. But you can easily apply this technique to incoming JMS messages, scheduled jobs and so on.

Also, the technique was explained using Spring Boot. But you can easily apply it to other Web frameworks as well.

Be creative - bend that spoon.

### References
[1] [Logback - Chapter 7: Filters](http://logback.qos.ch/manual/filters.html)