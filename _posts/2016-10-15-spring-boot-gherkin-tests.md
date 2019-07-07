---
layout: post
title: "Spring Boot: Gherkin tests"
date: 2016-10-15
---

In this post I show how you can implement Gherkin tests for Spring Boot 1.4.1. Here is an example of a Gherkin based test script:

<img class="alignnone size-full wp-image-2431" src="https://moelholm.files.wordpress.com/2016/10/screen-shot-2016-10-15-at-20-53-08.png" alt="screen-shot-2016-10-15-at-20-53-08" width="894" height="572" />

The <em>Feature</em>, <em>Scenario</em>, <em>Scenario Outline</em>, <em>Given</em>, <em>When</em>, <em>Then</em> and <em>And</em> constructs are part of the Gherkin test language [1]. Such tests are popular in Behavior-driven development (BDD) and is meant as a common tool between users from the business and users from the development team [2].
<blockquote>The idea is that you can execute such a Gherkin script and get a test result (did it work or not?)</blockquote>
Notice the Gherkin language, there is nothing that prevents you from writing such tests even before the real business code exists. In fact it is a BDD best practice to write the tests <em>before</em> the feature gets implemented:
<blockquote>Imagine if you and the business wrote Gherkin tests as part of a User Story's acceptance criteria...</blockquote>
I haven't done this yet. But I bet there are a lot of BDD practitioners that have.
<h3>About the Spring Boot 1.4 example</h3>
I have prepared a Spring Boot 1.4.1 based example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/hello-springboot-cucumber/" target="_blank">on GitHub</a>. Consult that to see the code in its entirety and true surroundings. The example consists of:
<ul>
	<li>The Gherkin test script you saw at the beginning of this post: It's a script that tests a "greetings" RESTful(<span style="text-decoration:underline;">ish</span>) resource.</li>
	<li>The greetings resource: A super simple Spring MVC <em>@RestController</em> that accepts a caller name as input and emits a greeting message as output. This is the resource being tested.</li>
</ul>
I have used a 5 step recipe for making this work....
<h3>Step 1 of 5: Configure the build script</h3>
The example uses Gradle as it's build technology. The Gherkin test support comes via the Cucumber-JVM test framework [3] and the Gradle Cucumber Plugin [4]. Here's the Gradle script:

[code language="groovy"]
buildscript {
    repositories {
        mavenCentral()
        // So that the Gradle Cucumber Plugin can be downloaded:
        maven { url "https://plugins.gradle.org/m2/" }
    }
    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:1.4.1.RELEASE")
        classpath("com.github.samueltbrown:gradle-cucumber-plugin:0.9")
    }
}

apply plugin: 'java'
apply plugin: 'spring-boot'
// So that the Gradle Cucumber Plugin gets activated:
apply plugin: 'com.github.samueltbrown.cucumber'

sourceCompatibility = 1.8
targetCompatibility = 1.8

repositories {
    mavenCentral()
}

dependencies {
    compile 'org.springframework.boot:spring-boot-starter-web'
    testCompile 'org.springframework.boot:spring-boot-starter-test'
    // So that you can use the cucumber API's for your step implementations:
    cucumberCompile 'info.cukes:cucumber-java:1.2.5'
    cucumberCompile 'info.cukes:cucumber-junit:1.2.5'
    cucumberCompile 'info.cukes:cucumber-spring:1.2.5'
}

cucumber {
    // So that you can generate some pretty (...) reports:
    formats = ['pretty', 'json:build/cucumber/cucumber.json', 'junit:build/cucumber/cucumber.xml', 'html:build/cucumber/html']

    // So that you can run all features/scenarios except for those annotated with @Ignore:
    tags = ['~@Ignore']
}
[/code]
Notice the comments in the buildscript. They highlight what parts of the Gradle script are particularly interesting.

By using the Gradle Cucumber Plugin you now have the support for a new source folder structure:

[code]
src/cucumber
|--- java
|--- resources
[/code]

You put the Gherkin step implementations in the <em>src/cucumber/java</em> directory and the Gherkin scripts under the <em>src/cucumber/resources</em> directory.
<h3>Step 2 of 5: Write the Gherkin tests</h3>
The Gherkin tests are written in a <em>.feature</em> file. In the example I put the following contents into <em>src/cucumber/resources/greetingsResource.feature</em>:

<img class="alignnone size-full wp-image-2431" src="https://moelholm.files.wordpress.com/2016/10/screen-shot-2016-10-15-at-20-53-08.png" alt="screen-shot-2016-10-15-at-20-53-08" width="894" height="572" />

This script contains 3 test scenarios.

The two first tests are based on the <em>Scenario Outline</em> and uses data from the <em>Examples</em> block. First column is the input we send to the <em>greetings</em> resource. Second and third columns are the expected outputs given that input. So: If we send in <em>Duke</em> to the <em>greetings</em> resource then we expect an HTTP status code <em>200</em> and a body with the message <em>Hello World, Duke</em>.

The third test is a <em>Scenario</em> that is not based on example input data. This test is just for fun ;) [5].

In the real world you would cover error conditions as well. So if you are testing a RESTful resource, like in this example, you would test for client errors 4xx etc.
<h3>Step 3 of 5: Implement the Gherkin steps test code</h3>
Here's the step implementations for the Gherkin script:

[code language="java"]
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration // Don't ask
public class GreetingsResourceSteps {

  @Autowired
  private TestRestTemplate restTemplate;

  private String caller; // input

  private ResponseEntity<String> response; // output

  @Given("I use the caller (.*)")
  public void useCaller(String caller) {
    this.caller = caller;
  }

  @When("I request a greeting")
  public void requestGreeting() {
    response = restTemplate
        .exchange("/greetings/{caller}", HttpMethod.GET, null, String.class, caller);
  }

  @Then("I should get a response with HTTP status code (.*)")
  public void shouldGetResponseWithHttpStatusCode(int statusCode) {
    assertThat(response.getStatusCodeValue()).isEqualTo(statusCode);
  }

  @And("The response should contain the message (.*)")
  public void theResponseShouldContainTheMessage(String message) {
    assertThat(response.getBody()).isEqualTo(message);
  }

}
[/code]

Take a look at the class definition: this is where we tell the cucumber test framework to kickstart the Spring container. In fact it's just like you would do in a typical Spring Boot 1.4 integration test: using the <em>@SpringBootTest</em> annotation. Said in another way: The Spring <em>ApplicationContext</em> will be launched prior to executing the Gherkin test scenarios.

Now take a look at lines 5+6: Here we inject Springs <em>TestRestTemplate</em>. We use this to send HTTP requests for our RESTful resource. Again, this is just like you would do in a typical Spring Boot 1.4 integration test.

Now take a look at the <em>@Given</em>, <em>@When</em>, <em>@Then</em>, and <em>@And</em> annotations: These define the methods implementing the steps. You can track them right back to the <em>src/cucumber/resources/greetingsResource.feature</em> file. Notice how we use simple regular expressions to map step input (fx <em>caller</em> values) to method parameters.

In case of errors, the steps throws ordinary <em>java.lang.AssertionError</em>s via the awesome AssertJ library [6].

See? It <em>almost</em> looks like a normal Spring Boot integration test. One major difference is the need for storing intermediate state in the class itself (or somewhere else: fx a shared class). Well rest in the knowledge that any involved step classes, here <em>GreetingsResourceSteps</em>, are disposed after each Scenario. Said in another way: you have a fresh "steps" instance for each scenario.

You may also want to take a look at the <em>@Before</em> and <em>@After</em> cucumber annotations. They resemble the same from JUnit.
<h3>Step 4 of 5: Implement the feature being tested</h3>
Lastly, we get to the actual feature. It's just the ordinary <em>@RestController</em>:

[code language="java"]
@RestController
public class GreetingsController {

  @GetMapping("/greetings/{caller}")
  public ResponseEntity<?> getGreeting(@PathVariable String caller) {

    if ("0xCAFEBABE".equalsIgnoreCase(caller)) {
      return new ResponseEntity<>(HttpStatus.I_AM_A_TEAPOT);
    }

    String greeting = String.format("Hello World, %s", caller);

    return new ResponseEntity<>(greeting, HttpStatus.OK);
  }

}
[/code]
Ahem ... I obviously wrote this controller after the Gherkin tests.
<h3>Step 5 of 5: Run the Gherkin tests and get the result</h3>
Thanks to the Gradle Cucumber Plugin, running the tests is a matter of:

[code]
./gradlew clean cucumber
[/code]

Here is an example output:

<img class="alignnone size-full wp-image-2432" src="https://moelholm.files.wordpress.com/2016/10/screen-shot-2016-10-15-at-20-52-46.png" alt="screen-shot-2016-10-15-at-20-52-46" width="1928" height="556" />

And here is an example output from the HTML generated report at <em>./build/cucumber/html/index.html</em>:

<img class="alignnone size-full wp-image-2433" src="https://moelholm.files.wordpress.com/2016/10/screen-shot-2016-10-15-at-20-54-36.png" alt="screen-shot-2016-10-15-at-20-54-36" width="996" height="938" />

Using Jenkins as a CI server? You can find a bunch of cucumber plugins for that. Just point the plugins to your <em>build/cucumber</em> directory and you are good to go.
<h3>In retrospective</h3>
This example was all about testing a RESTful resource. But Gherkin style tests are not limited to that:
<blockquote>The Gherkin step implemention code could test anything</blockquote>
You could drive Selenium tests if you want to. Or Spring <em>@Service</em> beans. You decide.
<blockquote>The important thing is that it helps you and the business drive the right solution</blockquote>
<h3>References</h3>
[1] Gherkin language:
<a href="https://cucumber.io/docs/reference" target="_blank">https://cucumber.io/docs/reference</a>

[2] Behavior-driven development (BDD) on Wikipedia:
<a href="https://en.wikipedia.org/wiki/Behavior-driven_development" target="_blank">https://en.wikipedia.org/wiki/Behavior-driven_development</a>

[3] Cucumber-JVM:
<a href="https://cucumber.io/docs/reference/jvm" target="_blank">https://cucumber.io/docs/reference/jvm</a>

[4] Gradle Cucumber Plugin
<a href="https://github.com/samueltbrown/gradle-cucumber-plugin" target="_blank">https://github.com/samueltbrown/gradle-cucumber-plugin</a>

[5] 418
<a href="https://sitesdoneright.com/blog/2013/03/what-is-418-im-a-teapot-status-code-error" target="_blank">https://sitesdoneright.com/blog/2013/03/what-is-418-im-a-teapot-status-code-error</a>

[6] AssertJ
<a href="http://joel-costigliola.github.io/assertj/" target="_blank">http://joel-costigliola.github.io/assertj/</a>