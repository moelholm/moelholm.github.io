---
layout: post
title: "Java: Custom logger factory that automatically infers the class name"
description: "How to declare loggers like this: Logger LOG = MyLoggerFactory.getLogger()"
date: 2016-08-30
comments: true
---

In this post I show how you can declare loggers like this:

```java
public class MyService {
    private static final Logger LOG = MyLoggerFactory.getLogger();
}
```

There is no argument to the `MyLoggerFactory::getLogger` method. Contrast that to the normal way to declare a logger:

```java
public class MyService {
    private static final Logger LOG = LoggerFactory.getLogger(MyService.class);
}
```

This is business as usual. But have you ever made that silly mistake where you copy/paste a class - and then, in the new class, forget to change the argument to that logger? It can be horribly misleading when reading log files afterwards.

The custom `MyLoggerFactory::getLogger` method is really super simple to implement: 3 lines of meat.

<h3>UPDATE: Alternative to the custom factory</h3>
On Reddit, while announcing this post, I was made aware of a simple alternative to the custom logger factory technique described in this post:

```java
public class MyService {
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.Lookup.lookupClass());
}
```

That technique uses a plain standard Java SE API to get the class name - see [1]. Personally I think this is a clever technique as well! 

I guess it is a matter of personal preferences to decide which logger declaration you want to use. If you still find the logger factory compelling - then read on...

### Implementation
I have prepared an example [on GitHub](https://github.com/nickymoelholm/smallexamples/tree/master/logging-custom-loggerfactory) - consult that to see the code in its entirety and full context. But here it goes, using _SLF4j/Logback_:

```java
package com.never.that.copy.paste.mistake.again;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyLoggerFactory {

    public static Logger getLogger() {

        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();

        String callersClassName = stackTrace[2].getClassName();

        return LoggerFactory.getLogger(callersClassName);
    }
}
```

3 lines of meat. The magic number `2` represents the class calling `MyLoggerFactory::getLogger`. The first positions in the `stackTrace` array represents the invocation to the `Thread::getStackTrace` method as well as this `MyLoggerFactory::getLogger` method itself.

I chose to name the method `getLogger` here, so that it aligns with the underlying logging framework _SLF4j/Logback_.

Please note, that no code here is specific to _SLF4j/Logback_: So go ahead and implement a corresponding factory for your own favorite logging framework. 

The example on GitHub has a very limited JUnit test that shows it works as expected:

```java
package com.never.that.copy.paste.mistake.again;

import org.junit.Test;
import org.slf4j.Logger;

import static org.junit.Assert.assertEquals;

public class MyLoggerFactoryTests {

    @Test
    public void getLogger_whenGivenNothing_thenReturnsLoggerWithCallersClassName() {

        // Given
        // ( a little bit of magic ... )

        // When
        Logger loggerOne = MyLoggerFactory.getLogger();
        Logger loggerTwo = LoggerTester.LOG;

        // Then
        assertEquals(MyLoggerFactoryTests.class.getName(), loggerOne.getName());
        assertEquals(LoggerTester.class.getName(), loggerTwo.getName());
    }

    private static class LoggerTester {
        private static final Logger LOG = MyLoggerFactory.getLogger();
    }

}
```

That's all there is to it. 

### References
[1] [Java SE's MethodHandles API](https://docs.oracle.com/javase/8/docs/api/java/lang/invoke/MethodHandles.Lookup.html#lookupClass--)
