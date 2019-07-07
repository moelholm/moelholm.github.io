---
layout: post
title: "Spring Boot and Gradle: Separating tests"
date: 2016-10-22
---

In this post I will present 4 different approaches to separating unit tests from integration tests, so that they can be run independently of each other. Here's the 4 different approaches:
<ul>
	<li>Separation based on name patterns</li>
	<li>Separation based on JUnit categories</li>
	<li>Separation based on Spring's <em>@IfProfileValue</em></li>
	<li>Separation based on different source directories</li>
</ul>
These approaches can easily be extended to apply to other test types as well (performance tests for example). Also, please note that:

<blockquote>Only one approach is specific to using Spring.

The remaining 3 approaches can just as well be used without Spring.</blockquote>

For each approach you will find a reference to a super simple GitHub based project. Consult the projects there to see the source code in its entirety and true surroundings. All projects are based on JUnit 4, Spring Boot 1.4 and Gradle.
<h3>Example code</h3>
This is the class being tested:

[code language="java"]
@Service
public class GreeterService {

  public String sayHello(String caller) {
    return String.format("Hello World, %s", caller);
  }

}
[/code]

The unit test class instantiates it directly:

[code language="java"]
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
[/code]

Unit tests (such as the above) can be run from Gradle like this: <em>./gradlew test</em>.

The integration test class uses Spring Boot like this:

[code language="java"]
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
[/code]

Integration tests (such as the above) can be run from Gradle like this: <em>./gradlew integrationTest</em>.
<h3>Separation based on name patterns</h3>
Find the GitHub project <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-namebased" target="_blank">here</a>.

This approach expects you to partition tests using different names. I have chosen these patterns:
<ul>
	<li>Unit test classes are suffixed with <em>Tests</em></li>
	<li>Integration test classes are suffixed with <em>IntegrationTests</em></li>
</ul>
There are no changes to the test classes you have already seen. Gradle takes care of that. Here's the relevant part:

[code language="groovy"]
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
[/code]

The important thing to remember here is that the patterns must end with <em>.class</em>. I hope you won't fall into the trap of forgetting that detail now...

So, this is easy. All driven from Gradle. However, if developers uses an invalid suffix by mistake, then please note that this will result in the test classes' test cases not being run at all. A bit dangerous.
<h3>Separation based on JUnit categories</h3>
Find the GitHub project <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-categories" target="_blank">here</a>.

This approach expects you to use JUnit annotations on the test classes. Firstly, create interfaces representing the test types:

[code language="java"]
public interface IntegrationTest {
}
[/code]

And:

[code language="java"]
public interface UnitTest {
}
[/code]

Then annotate your tests using the JUnit <em>@Category</em> annotation. Here's the unit test:

[code language="java"]
@Category(UnitTest.class)
public class GreeterServiceTests {

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
[/code]

Here's the integration test:

[code language="java"]
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
[/code]

Lastly, tell Gradle when to run the tests:

[code language="groovy"]
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
[/code]

So, this is easy as well. And it is type safe - so it is not brittle with respect to different test class names. Although not super elegant: Now you have to declare weird marker interfaces - and remember to annotate your test cases accordingly by pointing to them from the <em>@Category</em> annotation.

For more information about JUnit categories - see [1].
<h3>Separation based on Spring's @IfProfileValue</h3>
Find the GitHub project <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-ifprofilevalue" target="_blank">here</a>.

This approach expects you to consistently use a custom annotation plus Spring's <em>SpringRunner</em> on all classes - even unit tests.

Here's how the unit test class looks:

[code language="java"]
@RunWith(SpringRunner.class)
@UnitTest
public class GreeterServiceTests {

  @Test
  public void sayHello_whenInvokedWithDuke_thenSaysHelloWorldDuke() {
  ...
  }

}
[/code]

Here's how the integration test class looks:

[code language="java"]
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
[/code]

In addition to that you must also implement the annotations - they are simple though. Here's the<em> @UnitTest</em> annotation:

[code language="java"]
@Retention(RetentionPolicy.RUNTIME)
@IfProfileValue(name="testprofile", value="unittest")
public @interface UnitTest {
}
[/code]

Notice the <em>@IfProfileValue</em> annotation [2]. Read it like this: if there is a <span style="text-decoration:underline;">system property</span> defined and it has value <em>unittest</em>, then it means that the test is enabled.

Here's the<em> @IntegrationTest</em> annotation:

[code language="java"]
@Retention(RetentionPolicy.RUNTIME)
@IfProfileValue(name="testprofile", value="integrationtest")
@SpringBootTest
public @interface IntegrationTest {
}
[/code]

Again you see the <em>@IfProfileValue</em> annotation. This time  the value is different though: <em>integrationtest</em>. Also notice how the <em>@SpringBoot</em> test annotation is used here as a meta-annotation. Having it here means that we don't have to use it on the test classes also (in addition to the <em>@IntegrationTest</em> annotation and the<em> @RunWith</em> annotation).

The Gradle configuration is simple too:

[code language="groovy"]
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
[/code]

Notice how a system property is passed to the JVM - effectively activating either the<em> @UnitTest</em> or the<em> @IntegrationTest</em> annotations.

This approach is kind of like the one based on JUnit categories. But I think the test classes look a bit leaner. One minor issue, if at all, is that Spring is used for running the unit tests also. It means a minor initial overhead of a few seconds at most.
<h3>Separation based on different source directories</h3>
Find the GitHub project <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-testseparation-separatesrcdirs" target="_blank">here</a>.

This approach expects you to place unit tests in <em>src/test/java</em> and integration tests in <em>src/integrationTest/java</em>. No modifications to the test classes at all - no custom annotations, no categories.

Here's how it is defined with Gradle:

[code language="groovy"]
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
[/code]

Notice the comments - they highlight the relevant parts for getting it right.

This approach introduces another source directory layout and hence forces you to physically separate integration test classes from unit test classes. From a conceptual level I think this is the nicest model. But to be completely honest: getting the Gradle script "right" wasn't super easy. And I bet you can find variants of this out there that does something slightly different. Or at least looks different.
<h3>In retrospective</h3>
There are at least these 4 ways that you can choose between. Each of them works fine - so choose the one that is most meaningful to you and your team.
<h3>References</h3>
[1] JUnit 4 Categories:
<a href="https://github.com/junit-team/junit4/wiki/categories" target="_blank">https://github.com/junit-team/junit4/wiki/categories</a>

[2] @IfProfileValue JavaDoc:
<a href="http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/annotation/IfProfileValue.html" target="_blank">http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/annotation/IfProfileValue.html</a>