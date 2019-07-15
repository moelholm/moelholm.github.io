---
layout: post
title: "Spring Boot: Introduce your own insight endpoints"
description: "Implementing a custom actuator endpoint"
date: 2016-08-18
comments: true
---

In this post I show how you can develop custom Spring Boot Actuator HTTP endpoints for obtaining detailed insight into your Spring Boot application's runtime behavior.

Here's an example:

<img src="/img/2016-08-18-insight.png" class="w-100 pl-2 pr-2"/>

The above output is simple. Yet it can be useful to have in many applications. Like the "official" Spring Boot Actuator `/info` output.

If you don't find this concrete example interesting, then I'm sure that you can find _something_ in your Spring Boot applications that you would find interesting to have insight into. In fact, I recommend that you think about areas of your application that you would like to have insight into. Then provide endpoints that gives you this visibility.
<blockquote class="blockquote">When you develop a new feature, I bet you add unit tests and integration tests etc. So, while you are at it: add insight HTTP endpoints too.</blockquote>
Do this, so that you better understand the application's behavior. And do it, because when your system is in production and poop hits the fan: then insight HTTP endpoints may be there to save your b...ehind.

### About Spring Boot Actuator
Spring Boot Actuator offers a suite of HTTP endpoints that provide standard insight into a Spring Boot application. With them you can: show thread stacks, beans in the `ApplicationContext`, latest HTTP requests, information about the current application version, performance metrics and much more.

These insight "tools" are extremely useful. But:
<blockquote class="blockquote">The Spring Boot Actuator HTTP endpoints don't know anything that's specific about your application</blockquote>

### You can have much more insight
The fantastic Spring Boot team has, in traditional Spring framework spirit, ensured that the actuator framework is open for extension by us. And it is very easy!

I have created an [example on GitHub](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-actuator-custominsight) - ready for pull and play. Consult that for the full picture. But for your convenience - here is how I implemented the active users HTTP endpoint:

```java
@Component
public class ActiveUsersActuatorEndpoint extends AbstractMvcEndpoint {

    @Autowired
    private ActiveUsersService activeUsersService;

    public ActiveUsersActuatorEndpoint() {
        super("/activeusers", false /* sensitive */);
    }

    @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ActiveUsersResponse listActiveUsers() {
        return new ActiveUsersResponse("Active users right now", activeUsersService.listActiveUsers());
    }

    @JsonPropertyOrder({"info", "activeUsers"})
    public static class ActiveUsersResponse {

        @JsonProperty
        private String info;

        @JsonProperty
        private List&lt;String&gt; activeUsers;

        public ActiveUsersResponse(String info, List&lt;String&gt; activeUsers) {
            this.info = info;
            this.activeUsers = activeUsers;
        }
    }

}
```

This example extends a Spring Boot Actuator specific class: `AbstractMvcEndpoint`. They have their own `AbstractEndpoint` as well - but that's not so cool: you cannot use the flexible `@RequestMapping `annotation with that.

See the Spring Boot Reference Guide for further details on custom actuator endpoints [1].

### Don't use the normal Spring MVC controllers for this
Instead of registering your custom insight HTTP endpoints the Spring Boot Actuator way, you could also just expose plain Spring MVC endpoints. But that's not a wise approach.

Here's why:

- You would produce a parallel insight tool framework (alongside Spring Boot Actuator). That can be confusing for new developers on the application. Also, they may wonder why you don't just do it "the standard way" (as described in this post)
- If you register your own insight HTTP endpoints with Spring Boot Actuator - then they "follow along" with the location of the standard actuator endpoints. This includes the root URL context and the port number. So - should you choose to expose Spring Boot Actuator on 9090 instead of 8080 - then your custom endpoints would "follow along"

### References

[1] [Spring Boot Reference Guide: Adding custom endpoints](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#production-ready-customizing-endpoints-programmatically)