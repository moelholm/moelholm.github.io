---
layout: post
title: "Spring: Bean qualification"
description: "Handling the situation where multiple beans qualifies for an injection point"
date: 2016-10-23
comments: true
---

In this post I present how you can control a situation in which there are multiple beans that qualifies for an injection point in Spring.

The material here has been tested with Spring Framework 4.3.

### The problem
Let's first take a look at the problem. Imagine you have this interface:

```java
public interface BusinessEventLogger {
}
```

And two different implementations of this. First this:

```java
@Repository
public class DatabaseBusinessEventLogger implements BusinessEventLogger {
}
```

And then this:

```java
@Repository
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
```

Now, when you try to inject by the interface...

```java
@Service
public class GreeterService {

  @Autowired
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
```

... then Spring will fail with a `NoUniqueBeanDefinitionException`. That is because Spring cannot decide which repository implementation is appropriate. After all, there are two equally valid bean candidates here.

Techniques that you can use to get back in control:

Static decisions:
- Use the bean class
- Use the injection target member name
- Use the `@Qualifier` annotation
- Use a custom qualifier annotation
- Use `@Primary`

Runtime decisions:
- Use `@Profile`
- Use `@Profile` and `@Primary`

That should be enough to get you started. Notice the grouping. Some of the techniques require you at development time to know which bean is relevant. Other techniques allow you to defer the decision until runtime. The latter group is appropriate if the actual decision is environment specific for example.

I have prepared an example [On GitHub](https://github.com/nickymoelholm/smallexamples/tree/master/spring-beanqualification) that shows the problem and each of the solutions. It is based on Spring Framework 4.3 (via Spring Boot 1.4.1). And it is a multi module Gradle project. The problem scenario itself is illustrated in module `00_TheProblem`. The solution scenarios are illustrated in the modules named something similar to `0x_TheSolution_abc.`

### Solution 01: Use the bean class
This technique is applicable if you, at _development time_, already know the specific bean you need:

```java
@Service
public class GreeterService {

  @Autowired
  private WebServiceBusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
```

Notice that the class `WebServiceBusinessEventLogger` has been hardcoded here.

### Solution 02: Use the injection target member name
This technique is applicable if you, at _development time_, already know the specific bean you need:

```java
@Service
public class GreeterService {

  @Autowired
  private BusinessEventLogger webServiceBusinessEventLogger;

  public String sayHello(String caller) {
    webServiceBusinessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
```

Notice the name of the member field being injected into: `webServiceBusinessEventLogger`. This name happens to match the bean name of the bean that  is-a `WebServiceBusinessEventLogger`.

A bit fragile huh? One day another developer may drop by and refactor the name to something else. If that happens - then the application won't start anymore.

### Solution 03: Use @Qualifier
This technique is applicable if you, at _development time_, already know the specific bean you need:

```java
@Service
public class GreeterService {

  @Autowired @Qualifier("webServiceBusinessEventLogger")
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
```

Notice the use of Spring's `@Qualifier` annotation. It tells Spring exactly which bean is needed - by specifying its name.

I think this solution is more robust than solution 02. But it is still a bit fragile. What if somebody decides to refactor the name of the `WebServiceBusinessEventLogger` class?

### Solution 04: Use a custom qualifier annotation
This technique is applicable if you, at _development time_, already know the specific bean you need:

```java
@Service
public class GreeterService {

  @Autowired @WebServiceStrategy
  private BusinessEventLogger businessEventLogger;

  public String sayHello(String caller) {
    businessEventLogger.log("Sending hello message to %s", caller);
    return String.format("Hello World, %s", caller);
  }

}
```

Notice the use of the `@WebServiceStrategy` annotation. This is a custom qualifier annotation. It tells Spring what bean is used. To make this work though, you first have to define the annotation:

```java
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
public @interface WebServiceStrategy {
}
```

(Notice the use of Spring's` @Qualifier` here. Now it is being used as a meta-annotation)

And you will also have to add it to the bean:

```java
@Component
@WebServiceStrategy
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
```

You also need to do the same for the database logger.

This solution is as type safe as it gets. But at the expense of additional ceremony. It can make sense, if the abstraction of the qualifier annotation names is good enough.

### Solution 05: Use @Primary
This technique is applicable if you, at _development time_, already know the specific bean you need. You put Spring's `@Primary` annotation on the "primary" bean:

```java
@Component
@Primary
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
```

This will make the `WebServiceBusinessEventLogger` bean "win".

Notice the difference from the previous solutions:
<blockquote class="blockquote">Using Spring's @Primary annotation on a bean is a global decision: every injection point will get the chosen bean.</blockquote>
This may seem like a weird solution. And in production code - using it like this - perhaps it is. But this is not where `@Primary` shines. Rather:
<blockquote class="blockquote">The @Primary bean feature is interesting when used together with @Profile to activate the primary bean at runtime.

OR:

The @Primary bean feature is interesting when used for testing purposes.</blockquote>
If you haven't thought about this before, then now is the time to read that again 🙂.

For testing purposes you can use `@Primary` to make a test bean "win" over a business bean. Take a look at Baeldung's article for further inspiration [1]. In that article `@Primary` is used with a `@Bean` factory method and `@Profile` to make a test bean have precedence over a business bean. `@Profile` for this scenario isn't necessary - _unless_ the test bean also gets picked up when you run the application normally. That is typically an IDE configuration issue: when your test `*.class` files are colocated with the normal business `*.class` files (I've seen that in Eclipse once or twice).

### Solution 06: Use @Profile
This technique is applicable if you want to choose the bean at runtime.

If you are using Spring Boot you could, as an example, start the application with:

```code
--spring.profiles.active=webservice
```

... to activate the `webservice` profile. Or you could also do it from a test, like this:

```java
@RunWith(SpringRunner.class)
@SpringBootTest
@ActiveProfiles("webservice")
public class GreeterServiceIntegrationTests {
}
```

Notice the use of `@ActiveProfiles` - that tells Spring to run the ApplicationContext with the `webservice` profile activated.

In order for this to work, you also need to tell the conflicting beans what profile they belong to. You use the `@Profile` annotation for that. Here's how you would do it for the `WebServiceBusinessEventLogger` class:

```java
@Component
@Profile("webservice")
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
```

Notice `@Profile`. That annotation tells Spring to only add the bean to the `ApplicationContext` if the `webservice` profile is active. `@ActiveProfiles` is different: it's a test specific annotation that you put on test classes to tell Spring what profiles to activate when running the tests.

Unless you do anything else: You still need to put the `@Profile` annotation on the database logger too. Otherwise there will still be a conflict when you run with the `webservice` profile active (since, now there are two active beans candidates). If you have more candidates - then you will have to put `@Profile` on them too.

### Solution 07: Use @Profile and @Primary
This technique is applicable if you want to choose the bean at runtime. It is 90% similar to solution 06. But this solution doesn't require you to put` @Profile` on all candidates - only on the one that you also choose to be `@Primary`:

```java
@Component
@Profile("webservice")
@Primary
public class WebServiceBusinessEventLogger implements BusinessEventLogger {
}
```

That's it. Nothing else. If you have more candidates - then you will have to put `@Profile` and `@Primary` on them too.

The difference to solution 06, is that in this solution, one bean acts as a default bean: namely the one without `@Profile`.

### Conclusion
This post described different techniques to solving the situation where you have multiple bean candidates for an injection point. Some of them are appropriate if you can make the decision at development time. Others are appropriate if you would like the flexibility at runtime. All of them have been possible since Spring Framework 3.x.

I haven't included:

- XML examples
- Standards based qualification examples (JSR330 standard annotations [2])
- `@Bean` examples

They do provide some further alternatives to fulfil the mission. That is an exercise for the motivated reader 🙂.

I would love to hear from you, if you believe that I have forgotten some other obvious techniques. Just leave a comment before you leave.

### References
[1] [Injecting Mockito Mocks into Spring Beans](http://www.baeldung.com/injecting-mocks-in-spring)

[2] [What is the relation between JSR-299 and JSR-330 in Java EE 6? Do we need two DI APIS?](http://www.adam-bien.com/roller/abien/entry/what_is_the_relation_between)