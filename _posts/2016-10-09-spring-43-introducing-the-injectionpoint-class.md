---
layout: post
title: "Spring 4.3: Introducing the InjectionPoint class"
description: "Spring 4.3's hidden gem: @InjectionPoint"
date: 2016-10-09
comments: true
---

Did you know that Spring Framework 4.3 comes with a "hidden" gem: the `InjectionPoint` class?

At the time of writing this post, `InjectionPoint` is nowhere to be found in the Spring Framework Reference Documentation [2].

### About the InjectionPoint class
The `InjectionPoint` class [1] is a new feature that you can use in `@Bean` producer methods. It is specifically useful in `@Bean` methods that produces `prototype` scoped beans. And with it, you can get detailed information about the "places" into which your beans are injected. Said in another way: `@Bean` methods can now be made context aware.

If you know about `Contexts and Dependency Injection` (CDI) - then you may have heard about such a feature before. It is in fact an "oldie" in that context.

### Example
I've prepared an example [on GitHub](https://github.com/nickymoelholm/smallexamples/tree/master/hello-spring43-injectionpoint) - consult that for the source code in its full context. The example is based on Spring Boot 1.4 and therefore Spring Framework 4.3. Please bear with me .... in lack of a better example...

Imagine you want to inject a greeting into your `GreeterService`:

```java
@Service
public class GreeterService {

  @Autowired @Greeting(language = Language.EN)
  private String greeting;

  public String sayHello(String caller) {
    return String.format("%s, %s", greeting, caller);
  }

}
```

... here is one way you could implement it:

```java
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
```

Notice how this `@Bean` method uses the `InjectionPoint` to get access to the annotation on the dependency injection target field (`GreeterService.greeting`). The `Greeting` annotation is some annotation I dreamt up - super simple (not even a `Qualifier`).

In addition to the annotations on the dependency injection target field (/method/constructor...) you can also get the class object of the containing class (`GreeterService` in the above example). Take a look at the JavaDoc for further information [1].

That's it! Now, imagine what you can do with it 😉 ...

### Relation to scope
I propose that `InjectionPoint` is specifically designed to work with `prototype` scoped beans. You may think that's weird - but think about it this way:

- If you use `InjectionPoint` in a `singleton` scoped `@Bean` method...
- And if you have multiple places where the bean is injected...
- Then how would Spring know which `InjectionPoint` to hand to you?

You know what? I actually tested that...and it turns out I was given the first `InjectionPoint`. To be completely honest: that surprised me. I actually would have expected an exception from the container. But no - I just got "the first" injection target encountered by the container. Imagine what use you have of that. My best guess is: no use at all. 

CDI, by the way, only allows `InjectionPoint`s when used with the `dependent` scope. Please take into account that CDI's `dependent` scope and Spring's `prototype` scope are roughly equivalent.

### References
[1] [Spring Frameworks JavaDoc on the InjectionPoint class](http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/InjectionPoint.html)

[2] [Spring Framework Reference Documentation](http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/)

