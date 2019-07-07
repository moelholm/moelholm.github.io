---
layout: post
title: "Spring 4.3: Introducing the InjectionPoint class"
description: "Spring 4.3's hidden gem: @InjectionPoint"
date: 2016-10-09
---

Did you know that Spring Framework 4.3 comes with a "hidden" gem: the <em>InjectionPoint</em> class ?

At the time of writing this post, <em>InjectionPoint</em> is nowhere to be found in the Spring Framework Reference Documentation [2].

<h3>About the InjectionPoint class</h3>
The <em>InjectionPoint</em> class [1] is a new feature that you can use in <em>@Bean</em> producer methods. It is specifically useful in <em>@Bean</em> methods that produces <em>prototype</em> scoped beans. And with it, you can get detailed information about the "places" into which your beans are injected. Said in another way:
<blockquote><em>@Bean</em> methods can now be made context aware</blockquote>
If you know about <em>Contexts and Dependency Injection</em> (CDI) - then you may have heard about such a feature before. It is in fact an "oldie" in that context.

<h3>Example</h3>
I've prepared an example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/hello-spring43-injectionpoint" target="_blank">on GitHub</a> - consult that for the source code in its full context. The example is based on Spring Boot 1.4 and therefore Spring Framework 4.3. Please bear with me .... in lack of a better example...

Imagine you want to inject a greeting into your <em>GreeterService</em>:

[code language="java"]
@Service
public class GreeterService {

  @Autowired @Greeting(language = Language.EN)
  private String greeting;

  public String sayHello(String caller) {
    return String.format("%s, %s", greeting, caller);
  }

}
[/code]

... here is one way you could implement it:

[code language="java"]
@Configuration
public class MyBeanConfig {

  @Bean
  @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
  public String greeting(InjectionPoint ip) {

    Greeting greeting = findAnnotation(ip.getAnnotatedElement(),
                        Greeting.class);

    return (Language.DA == greeting.language()) ? "Hej Verden" : "Hello World";
  }

}
[/code]

Notice how this <em>@Bean</em> method uses the <em>InjectionPoint</em> to get access to the annotation on the dependency injection target field (<em>GreeterService.greeting</em>). The <em>Greeting</em> annotation is some annotation I dreamt up - super simple (not even a <em>Qualifier</em>).

In addition to the annotations on the dependency injection target field (/method/constructor...) you can also get the class object of the containing class (<em>GreeterService</em> in the above example). Take a look at the JavaDoc for further information [1].

That's it! Now, imagine what you can do with it ;) ...

<h3>Relation to scope</h3>
I propose that <em>InjectionPoint</em> is specifically designed to work with <em>prototype</em> scoped beans. You may think that's weird - but think about it this way:
<ul>
	<li>If you use <em>InjectionPoint</em> in a <em>singleton</em> scoped<em> @Bean</em> method...</li>
	<li>And if you have multiple places where the bean is injected...</li>
	<li>Then how would Spring know which <em>InjectionPoint</em> to hand to you?</li>
</ul>

You know what? I actually tested that...and it turns out I was given the first <em>InjectionPoint</em>. To be completely honest: that surprised me. I actually would have expected an exception from the container. But no - I just got "the first" injection target encountered by the container. Imagine what use you have of that. My best guess is: no use at all. 

CDI, by the way, only allows <em>InjectionPoint</em>s when used with the <em>dependent</em> scope. Please take into account that CDI's <em>dependent</em> scope and Spring's <em>prototype</em> scope are roughly equivalent.

<h3>References</h3>
[1] Spring Frameworks JavaDoc on the InjectionPoint class:
<a href="http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/InjectionPoint.html">http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/InjectionPoint.html</a>

[2] Spring Framework Reference Documentation:
<a href="http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/">http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/</a>

