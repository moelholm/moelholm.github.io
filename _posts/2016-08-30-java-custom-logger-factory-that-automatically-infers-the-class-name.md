---
layout: post
title: "Java: Custom logger factory that automatically infers the class name"
description: "How to declare loggers like this: Logger LOG = MyLoggerFactory.getLogger()"
date: 2016-08-30
---

In this post I show how you can declare loggers like this:

[code language="Java"]
public class MyService {
    private static final Logger LOG = MyLoggerFactory.getLogger();
}
[/code]
There is no argument to the <em>MyLoggerFactory::getLogger</em> method. Contrast that to the normal way to declare a logger:

[code language="Java"]
public class MyService {
    private static final Logger LOG = LoggerFactory.getLogger(MyService.class);
}
[/code]

This is business as usual. But have you ever made that silly mistake where you copy/paste a class - and then, in the new class, forget to change the argument to that logger? It can be horribly misleading when reading log files afterwards.

The custom <em>MyLoggerFactory::getLogger</em> method is really super simple to implement: 3 lines of meat.

<h3>UPDATE: Alternative to the custom factory</h3>
On Reddit, while announcing this post, I was made aware of a simple alternative to the custom logger factory technique described in this post:
[code language="Java"]
public class MyService {
    private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.Lookup.lookupClass());
}
[/code]
That technique uses a plain standard Java SE API to get the class name - see [1]. Personally I think this is a clever technique as well! 

I guess it is a matter of personal preferences to decide which logger declaration you want to use. If you still find the logger factory compelling - then read on...

<h3>Implementation</h3>
I have prepared an example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/logging-custom-loggerfactory" target="_blank">on GitHub</a> - consult that to see the code in its entirety and full context. But here it goes, using <em>SLF4j/Logback</em>:

[code language="Java"]
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
[/code]

3 lines of meat. The magic number <em>2</em> represents the class calling <em>MyLoggerFactory::getLogger</em>. The first positions in the <em>stackTrace</em> array represents the invocation to the <em>Thread::getStackTrace</em> method as well as this <em>MyLoggerFactory::getLogger</em> method itself.

I chose to name the method <em>getLogger</em> here, so that it aligns with the underlying logging framework <em>SLF4j/Logback</em>.

Please note, that no code here is specific to <em>SLF4j/Logback</em>: So go ahead and implement a corresponding factory for your own favorite logging framework. 

The example on GitHub has a very limited JUnit test that shows it works as expected:
[code language="Java"]
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
[/code]

That's all there is to it. 

<h3>References</h3>
[1] Java SE's MethodHandles API:
https://docs.oracle.com/javase/8/docs/api/java/lang/invoke/MethodHandles.Lookup.html#lookupClass--
