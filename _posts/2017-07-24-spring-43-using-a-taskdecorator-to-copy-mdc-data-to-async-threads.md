---
layout: post
title: "Spring 4.3: Using a TaskDecorator to copy MDC data to @Async threads"
description: "How to pass MDC data to asynchronous threads"
date: 2017-07-24
comments: true
tags: java spring spring-boot @async mdc logging
---

In this post I am going to show how to copy MDC data from Web threads to @Async threads using a brand new Spring Framework 4.3 feature: `ThreadPoolTaskExecutor#setTaskDecorator()` [set-task-decorator]. 

This is the end result:

<img src="/img/2017-07-24-taskdecorator.png" class="w-100 pl-2 pr-2" />

Notice the third and second last log lines: they have `[userId:Duke]` just left of the log level. The first line is emitted from a Web thread (a `@RestController`) and the second line is emitted from an `@Async` method thread. Essentially MDC data was copied from the Web thread onto the `@Async` thread (That was the cool part 😏). 

Read on to see how that can be achieved. All the code presented here can be found in the example project <a href="https://github.com/moelholm/smallexamples/tree/master/spring43-async-taskdecorator" target="_blank">on GitHub</a>. Consult that to see all the details if necessary.

<h3>About the example project</h3>
The example project is based on Spring Boot 2. The logging API used here is SLF4J over Logback (use of <em>Logger, LoggerFactory and MDC</em>).

If you take a look at the example project you will find this `@RestController`:

```java
@RestController
public class MessageRestController {

  private final Logger logger = LoggerFactory.getLogger(getClass());

  private final MessageRepository messageRepository;

  MessageRestController(MessageRepository messageRepository) {
    this.messageRepository = messageRepository;
  }

  @GetMapping
  List<String> list() throws Exception {
    logger.info("RestController in action");
    return messageRepository.findAll().get();
  }
}
```

Notice that it logs `RestController in action`. Also notice that it has this weird call to the repository: `messageRepository.findAll().get()`. That's because it executes an `asynchronous` method, receives a `Future`, and waits for it until it returns. So a Web thread invoking an `@Async` method. This is obviously a rather contrived example (I guess you use asynchronous methods for something sane in your projects).

This is the repository:

```java
@Repository
class MessageRepository {

  private final Logger logger = LoggerFactory.getLogger(getClass());

  @Async
  Future<List<String>> findAll() {
    logger.info("Repository in action");
    return new AsyncResult<>(Arrays.asList("Hello World", "Spring Boot is awesome"));
  }
}
```

Notice that the method logs `Repository in action`.

Just for completeness, let me show you how the MDC data is setup for Web threads:

```java
@Component
public class MdcFilter extends GenericFilterBean {

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    try {
      MDC.put("mdcData", "[userId:Duke]");
      chain.doFilter(request, response);
    } finally {
      MDC.clear();
    }
  }
}
```

If we don't do anything else, then we have MDC data properly configured for Web threads. But we cannot "follow" a Web request when it transfers into `@Async` method invocations: The MDC data's (hidden) `ThreadLocal` data is simply not copied automatically. The good news is that this is super easy to fix...

### Solution part 1 of 2: Configure the @Async ThreadPool
Firstly, customize the asynchronous functionality. I did it like this:

```java
@EnableAsync(proxyTargetClass = true)
@SpringBootApplication
public class Application extends AsyncConfigurerSupport {

  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setTaskDecorator(new MdcTaskDecorator());
    executor.initialize();
    return executor;
  }

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

The interesting part is that we extend `AsyncConfigurerSupport` in order to customize the thread pool.

More precisely: `executor.setTaskDecorator(new MdcTaskDecorator())`. This is how we enable the custom `TaskDecorator`.

### Solution part 2 of 2: Implement the TaskDecorator
Now to the custom `TaskDecorator`:

```java
class MdcTaskDecorator implements TaskDecorator {

  @Override
  public Runnable decorate(Runnable runnable) {
    // Right now: Web thread context !
    // (Grab the current thread MDC data)
    Map<String, String> contextMap = MDC.getCopyOfContextMap();
    return () -> {
      try {
        // Right now: @Async thread context !
        // (Restore the Web thread context's MDC data)
        MDC.setContextMap(contextMap);
        runnable.run();
      } finally {
        MDC.clear();
      }
    };
  }
}
```

The `decorate()` method takes one `Runnable` and returns another one. 

Here, I basically wrap the original `Runnable` and maintain the MDC data around a delegation to its `run()` method. 

### Conclusion
It is actually quite easy to copy MDC data from a Web thread context onto the asynchronous threads' context. 

The technique shown here isn't limited to copying MDC data. You can use it to copy other `ThreadLocal` data as well. You can also use the `TaskDecorator` for something completely different. Logging, measure asynchronous method durations, swallowing exceptions, exiting the JVM - whatever makes you happy.

A big thank you to Joris Kuipers (<a href="https://twitter.com/jkuipers" target="_new">@jkuipers</a>) for making me aware of this new functionality in Spring Framework 4.3. An awesome tip 🤗. 

### References
[set-task-decorator] [ThreadPoolTaskExecutor#setTaskDecorator() (Spring’s JavaDoc)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskExecutor.html#setTaskDecorator-org.springframework.core.task.TaskDecorator-)
