---
layout: post
title: "Spring Boot and Gradle: Separating tests"
description: "Approaches for separating unit tests from integration tests"
date: 2016-10-22
comments: true
tags: java spring unit-test integration-test gradle
---

In this post I will present 4 different approaches to separating unit tests from integration tests, so that they can be run independently of each other. Here's the 4 different approaches:

- Separation based on name patterns
- Separation based on JUnit categories
- Separation based on Spring's `@IfProfileValue`
- Separation based on different source directories

These approaches can easily be extended to apply to other test types as well (performance tests for example). Also, please note that:

<blockquote class="blockquote">Only one approach is specific to using Spring.

The remaining 3 approaches can just as well be used without Spring.</blockquote>

For each approach you will find a reference to a super simple GitHub based project. Consult the projects there to see the source code in its entirety and true surroundings. All projects are based on JUnit 4, Spring Boot 1.4 and Gradle.

### Example code
This is the class being tested:

```java
@Service
public class GreeterService {

  public String sayHello(String caller) {
    return String.format("Hello World, %s", caller);
  }

}
```

The unit test class instantiates it directly:

```java
public class GreeterServiceTests {

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {

    // Given
    GreeterService greeterService = new GreeterService();

    // When
    String greeting = greeterService.sayHello("Duke");

    // Then
    assertThat(greeting).isEqualTo("Hello World, Duke");

  }

}
```

Unit tests (such as the above) can be run from Gradle like this: `./gradlew test`.

The integration test class uses Spring Boot like this:

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class GreeterServiceIntegrationTests {

  @Autowired
  private GreeterService greeterService;

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {

    // When
    String greeting = greeterService.sayHello("Duke");

    // Then
    assertThat(greeting).isEqualTo("Hello World, Duke");

  }

}
```

Integration tests (such as the above) can be run from Gradle like this: `./gradlew integrationTest`.

### Separation based on name patterns
Find the GitHub project [here](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-namebased).

This approach expects you to partition tests using different names. I have chosen these patterns:

- Unit test classes are suffixed with `Tests`
- Integration test classes are suffixed with `IntegrationTests`
  
There are no changes to the test classes you have already seen. Gradle takes care of that. Here's the relevant part:

```groovy
...
apply plugin: 'java'
apply plugin: 'spring-boot'
...

test {
    useJUnit {
        exclude '**/*IntegrationTests.class'
    }
}

task integrationTest(type: Test) {
    useJUnit {
        include '**/*IntegrationTests.class'
    }
}
```

The important thing to remember here is that the patterns must end with `.class`. I hope you won't fall into the trap of forgetting that detail now...

So, this is easy. All driven from Gradle. However, if developers uses an invalid suffix by mistake, then please note that this will result in the test classes' test cases not being run at all. A bit dangerous.

### Separation based on JUnit categories
Find the GitHub project [here](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-categories).

This approach expects you to use JUnit annotations on the test classes. Firstly, create interfaces representing the test types:

```java
public interface IntegrationTest {
}
```

And:

```java
public interface UnitTest {
}
```

Then annotate your tests using the JUnit `@Category` annotation. Here's the unit test:

```java
@Category(UnitTest.class)
public class GreeterServiceTests {

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
```

Here's the integration test:

```java
@SpringBootTest
@RunWith(SpringRunner.class)
@Category(IntegrationTest.class)
public class GreeterServiceIntegrationTests {

  @Autowired
  private GreeterService greeterService;

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
```

Lastly, tell Gradle when to run the tests:

```groovy
...
apply plugin: 'java'
apply plugin: 'spring-boot'
...

test {
    useJUnit {
        includeCategories 'com.moelholm.UnitTest'
    }
}

task integrationTest(type: Test) {
    useJUnit {
        includeCategories 'com.moelholm.IntegrationTest'
    }
}
```

So, this is easy as well. And it is type safe - so it is not brittle with respect to different test class names. Although not super elegant: Now you have to declare weird marker interfaces - and remember to annotate your test cases accordingly by pointing to them from the `@Category` annotation.

For more information about JUnit categories - see [1].

### Separation based on Spring's @IfProfileValue
Find the GitHub project [here](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-ifprofilevalue).

This approach expects you to consistently use a custom annotation plus Spring's `SpringRunner` on all classes - even unit tests.

Here's how the unit test class looks:

```java
@RunWith(SpringRunner.class)
@UnitTest
public class GreeterServiceTests {

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
```

Here's how the integration test class looks:

```java
@RunWith(SpringRunner.class)
@IntegrationTest
public class GreeterServiceIntegrationTests {

  @Autowired
  private GreeterService greeterService;

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
```

In addition to that you must also implement the annotations - they are simple though. Here's the` @UnitTest` annotation:

```java
@Retention(RetentionPolicy.RUNTIME)
@IfProfileValue(name="testprofile", value="unittest")
public @interface UnitTest {
}
```

Notice the `@IfProfileValue` annotation [2]. Read it like this: if there is a _system property_ defined and it has value `unittest`, then it means that the test is enabled.

Here's the` @IntegrationTest` annotation:

```java
@Retention(RetentionPolicy.RUNTIME)
@IfProfileValue(name="testprofile", value="integrationtest")
@SpringBootTest
public @interface IntegrationTest {
}
```

Again you see the `@IfProfileValue` annotation. This time  the value is different though: `integrationtest`. Also notice how the `@SpringBoot` test annotation is used here as a meta-annotation. Having it here means that we don't have to use it on the test classes also (in addition to the `@IntegrationTest` annotation and the` @RunWith` annotation).

The Gradle configuration is simple too:

```groovy
...
apply plugin: 'java'
apply plugin: 'spring-boot'
...

test {
    useJUnit {
        systemProperty "testprofile", "unittest"
    }
}

task integrationTest(type: Test) {
    useJUnit {
        systemProperty "testprofile", "integrationtest"
    }
}
```

Notice how a system property is passed to the JVM - effectively activating either the` @UnitTest` or the` @IntegrationTest` annotations.

This approach is kind of like the one based on JUnit categories. But I think the test classes look a bit leaner. One minor issue, if at all, is that Spring is used for running the unit tests also. It means a minor initial overhead of a few seconds at most.

### Separation based on different source directories
Find the GitHub project [here](https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-separatesrcdirs).

This approach expects you to place unit tests in `src/test/java` and integration tests in `src/integrationTest/java`. No modifications to the test classes at all - no custom annotations, no categories.

Here's how it is defined with Gradle:

```groovy
...
apply plugin: 'java'
apply plugin: 'spring-boot'
...

dependencies {
    compile('org.springframework.boot:spring-boot-starter-web')
    // So that we can use JUnit and the test dependencies pulled in by Spring Boot
    // from 'src/test/java' as well as 'src/integrationTest/java':
    testCompile('org.springframework.boot:spring-boot-starter-test')
}

sourceSets {
    // So that we can place source code in 'src/integrationTest/java':
    integrationTest {
        java {

            // So that we can compile against the business classes (GreeterService, ...):
            compileClasspath += main.output
            // So that we can compile against the libs used by the business classes:
            compileClasspath += main.compileClasspath

            // So that we can compile against the unit test classes (custom utilities fx):
            compileClasspath += test.output
            // So that we can compile against the libs used by the unit test classes (JUnit, Spring test support, ...):
            compileClasspath += test.compileClasspath

            // So that test- and business classes can be used at runtime:
            runtimeClasspath += test.runtimeClasspath

        }
    }
}

task integrationTest(type: Test) {

    // So that Gradle knows where the integration test classes are:
    testClassesDir = sourceSets.integrationTest.output.classesDir

    // So that Gradle knows which runtime class path to use:
    classpath = sourceSets.integrationTest.runtimeClasspath

}
```

Notice the comments - they highlight the relevant parts for getting it right.

This approach introduces another source directory layout and hence forces you to physically separate integration test classes from unit test classes. From a conceptual level I think this is the nicest model. But to be completely honest: getting the Gradle script "right" wasn't super easy. And I bet you can find variants of this out there that does something slightly different. Or at least looks different.

### In retrospective
There are at least these 4 ways that you can choose between. Each of them works fine - so choose the one that is most meaningful to you and your team.

### References
[1] [JUnit 4 Categories](https://github.com/junit-team/junit4/wiki/categories)

[2] [@IfProfileValue JavaDoc](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/annotation/IfProfileValue.html)