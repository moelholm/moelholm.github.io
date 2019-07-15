---
layout: post
title: "Spring Boot: Prometheus actuator endpoint"
description: "How you can expose a Prometheus endpoint"
date: 2017-02-06
comments: true
tags: java spring spring-boot prometheus spring-boot-actuator
---

In this post I show how you can add support for Prometheus in Spring Boot applications.

### Step 1 of 2: Add the Prometheus Spring Boot Starter
You can get Prometheus support in Spring Boot applications via a so-called "starter". Here is how to get that...

It's a one liner in Gradle:

```groovy
compile 'com.moelholm:prometheus-spring-boot-starter:1.0.1'
```

And a five liner in Maven:

```groovy
<dependency>
  <groupId>com.moelholm</groupId>
  <artifactId>prometheus-spring-boot-starter</artifactId>
  <version>1.0.1</version>
</dependency>
```

That's it. Ready for testing it?

### Step 2 of 2: Test it

Now you have a new Spring Boot Actuator endpoint. If you haven't changed the management port and default application port - then you can find it here:

```code
http://localhost:8080/prometheus
```

That will give you output like this:

```code
# HELP httpsessions_max httpsessions_max
# TYPE httpsessions_max gauge
httpsessions_max -1.0
# HELP httpsessions_active httpsessions_active
# TYPE httpsessions_active gauge
httpsessions_active 0.0
# HELP mem mem
# TYPE mem gauge
mem 368223.0
# HELP mem_free mem_free
# TYPE mem_free gauge
mem_free 226605.0
... ( and so on and so forth forever ) ...
```

I have created a working example on [GitHub](https://github.com/moelholm/smallexamples/blob/master/springboot-actuator-prometheus/) - consult that to see the starter used and validated from an integration test.

### Optional configuration
The Prometheus endpoint can be configured via 2 properties:

- endpoints.prometheus.path
- endpoints.prometheus.sensitive

The first one defaults to `/prometheus`. The second one defaults to `false`. Feel free to change any one of them by setting the properties in your Spring Boot `application.properties` file (or YAML if you are into that stuff).

### About the Spring Boot Starter
I recently had to add Prometheus support to some of our Spring Boot applications at my work. 

I searched (a bit) and did find another nice starter by Thomas Darimont [1]. The problem with this starter, for us, was that it:

- Wasn't in the Maven Central
- Didn't add the Prometheus endpoint as a real Spring Boot Actuator endpoint

I also found another starter by Oleg Vyukov [2]. But I found the implementation a bit complicated - at least compared with other material on how to manually activate a Prometheus endpoint. That made me a bit nervous... 

So I figured: why not...create another starter myself 🙂. That is the one you see referenced in the above example. You can find the source code for it on [GitHub](https://github.com/moelholm/prometheus-spring-boot-starter).

### References
[1] [Thomas Darimont's starter](https://github.com/thomasdarimont/prometheus-spring-boot-starter)

[2] [Oleg Vyukov's starter](https://github.com/akaGelo/spring-boot-starter-prometheus)