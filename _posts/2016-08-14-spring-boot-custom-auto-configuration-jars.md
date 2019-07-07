---
layout: post
title: "Spring Boot: Custom auto-configuration JARs"
description: "Creating a utility project that magically enhance your application"
date: 2016-08-14
---

<blockquote>Custom auto-configuration JAR:

A shared JAR module containing Spring beans that can be automatically activated in one or more Spring Boot applications.</blockquote>
Auto-configuration JARs are extensively used by the official Spring Boot starter modules you are using in your every-day Spring Boot applications. But did you know that you easily can create such functionality yourself too?

Here's how to do it. From your shared Java project, start by creating a Spring <em>@Configuration</em>:

[code language="Java"]
@Configuration
@ConditionalOnWebApplication
@ConditionalOnClass(EndpointHandlerMapping.class)
public class DumpAutoConfiguration {

@Bean @Qualifier("title")
public String dumpUiTitle() { return "UI Dump" ; }

}
[/code]

Then tell Spring Boot that this is an auto-configuration JAR by adding a <em>META-INF/spring.factories</em> file to the classpath:
<pre>org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.moelholm.tools.actuatorui.dump.DumpAutoConfiguration</pre>
Done.
<h3>About the example</h3>
Did you notice the annotations <em>@ConditionalOnWebApplication</em> and<em> @ConditionalOnClass</em>? They are used to ensure that the configuration is only activated if the target Spring Boot application environment satisfies some expected circumstances.

The Spring Boot application that includes this JAR will now have a new bean in the ApplicationContext: <em>dumpUiTitle</em>. This bean can be injected like any other bean:

[code language="Java"]
@Autowired @Qualifier("title") private String title;
[/code]

The example code above is inspired by the <em>actuator-ui-dump</em> JAR I developed a while ago. This JAR registers a new Spring MVC controller that renders a UI on top of the <em>dump</em> actuator endpoint. For details about the <em>actuator-ui-dump</em>: <a href="http://moelholm.com/blog/2016/08/12/spring-boot-ui-for-the-dump-endpoint" target="_blank">see my previous post</a>.

It is very different from a typical JAR file. A typical JAR file is passive: it only contributes classes and resources that you then need to manually use from your application. The Spring Boot custom auto-configuration JAR files contributes <em>services</em> to the application. It could be Spring MVC HandlerInterceptors, Spring AOP aspects or whatever else you can do with a typical Spring application. And all your Spring Boot applications need to do is: add the JAR to the classpath.

The Spring Boot reference manual has more detailed information on the subject - see [1]. If you want to see the example code above in it's actual context - then see the source code on GitHub [2].
<h3>References</h3>
[1] Spring Boot reference manual - on auto-configuration:
http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-understanding-auto-configured-beans

[2] Source code for the <em>actuator-ui-dump</em> module on GitHub:
https://github.com/nickymoelholm/tools/tree/master/actuator-ui-dump