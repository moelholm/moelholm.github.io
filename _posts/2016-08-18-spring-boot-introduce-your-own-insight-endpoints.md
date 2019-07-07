---
layout: post
title: "Spring Boot: Introduce your own insight endpoints"
date: 2016-08-18
---

In this post I show how you can develop custom Spring Boot Actuator HTTP endpoints for obtaining detailed insight into your Spring Boot application's runtime behavior.

Here's an example:

<img class="alignnone size-full wp-image-1290" src="https://moelholm.files.wordpress.com/2016/08/screen-shot-2016-08-18-at-20-28-21.png" alt="Screen Shot 2016-08-18 at 20.28.21" width="814" height="396" />

The above output is simple. Yet it can be useful to have in many applications. Like the "official" Spring Boot Actuator <em>info</em> output.

If you don't find this concrete example interesting, then I'm sure that you can find <em>something</em> in your Spring Boot applications that you would find interesting to have insight into. In fact, I recommend that you think about areas of your application that you would like to have insight into. Then provide endpoints that gives you this visibility.
<blockquote>When you develop a new feature, I bet you add unit tests and integration tests etc. So, while you are at it: add insight HTTP endpoints too.</blockquote>
Do this, so that you better understand the application's behavior. And do it, because when your system is in production and poop hits the fan: then insight HTTP endpoints may be there to save your b...ehind.
<h3>About Spring Boot Actuator</h3>
Spring Boot Actuator offers a suite of HTTP endpoints that provide standard insight into a Spring Boot application. With them you can: show thread stacks, beans in the <em>ApplicationContext</em>, latest HTTP requests, information about the current application version, performance metrics and much more.

These insight "tools" are extremely useful. But:
<blockquote>The Spring Boot Actuator HTTP endpoints don't know anything that's specific about <em>your</em> application</blockquote>
 
<h3>You can have much more insight</h3>
The fantastic Spring Boot team has, in traditional Spring framework spirit, ensured that the actuator framework is open for extension by us. And it is very easy!

I have created an <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-actuator-custominsight" target="_blank">example on GitHub</a> - ready for pull and play. Consult that for the full picture. But for your convenience - here is how I implemented the active users HTTP endpoint:

[code language="java"]
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
[/code]

This example extends a Spring Boot Actuator specific class: <em>AbstractMvcEndpoint</em>. They have their own <em>AbstractEndpoint</em> as well - but that's not so cool: you cannot use the flexible <em>@RequestMapping </em>annotation with that.

See the Spring Boot Reference Guide for further details on custom actuator endpoints [1].
<h3>Don't use the normal Spring MVC controllers for this</h3>
Instead of registering your custom insight HTTP endpoints the Spring Boot Actuator way, you could also just expose plain Spring MVC endpoints. But that's not a wise approach.

Here's why:
<ul>
	<li>You would produce a parallel insight tool framework (alongside Spring Boot Actuator). That can be confusing for new developers on the application. Also, they may wonder why you don't just do it "the standard way" (as described in this post).</li>
	<li>If you register your own insight HTTP endpoints with Spring Boot Actuator - then they "follow along" with the location of the standard actuator endpoints. This includes the root URL context and the port number. So - should you choose to expose Spring Boot Actuator on 9090 instead of 8080 - then your custom endpoints would "follow along".</li>
</ul>
<h3>References</h3>
[1] Spring Boot Reference Guide: Adding custom endpoints:
http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#production-ready-customizing-endpoints-programmatically