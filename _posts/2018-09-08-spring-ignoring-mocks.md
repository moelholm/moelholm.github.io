---
layout: post
title: "Spring: Ignoring mocks"
description: "How you can make Spring ignore your test mocks"
date: 2018-09-08
---

If you are using the core Spring Framework (that is, not Spring Boot), then you may have encountered a problem where Spring doesn't seem to completely ignore mocked beans in your tests: Perhaps Spring attempts to inject beans into them or run your <em>@PostConstruct</em> lifecycle methods. In this post I present that problem together with a solution for it.

<blockquote>
If you are using Spring Boot and have this behavior. Then there is a big chance that you are holding it wrong. There is a note on how to hold it right for you too :).
</blockquote>

I have created an example application <a href="https://github.com/moelholm/smallexamples/tree/master/spring-please-ignore-my-mocks" target="_blank">on GitHub</a>. That application contains all the code that you see here. It is based on Spring Boot 2.0 and Java 8.

<h3>The problem</h3>
When you mock a Spring bean in your non-Spring Boot tests, and if the mock is based on a class and not an interface, then Spring attempts to autowire any dependencies it may have. Spring also attempts to invoke any <em>@PostConstruct</em> initializers that it may have. But …​ you just want to mock that d**n bean, right?

Consider the following bean that we want to test (our SUT):
[code language="java"]
public class GreeterService {

  @Autowired
  private GreeterDao greeterDao;

  public String sayHello(String caller) {
    String greetingTemplate = greeterDao.findGreeting();
    return String.format(greetingTemplate, caller);
  }
}
[/code]

And this bean that we want to mock in our test:
[code language="java"]
public class GreeterDao {

  @Autowired
  private AnnoyingBean annoyingBean;

  @PostConstruct
  private void explodeOnStartup() {
    throw new RuntimeException("Oh no !");
  }

  public String findGreeting() {
    return "Hello world, %s";
  }
}
[/code]

Here is a test that attempts to mock it:
[code language="java"]
@RunWith(SpringRunner.class)
@ContextConfiguration(classes = BadTestConfig.class)
public class ProblemWithoutSpringBootGreeterServiceTests {

  @Autowired
  private GreeterService greeterService;

  @Autowired
  private GreeterDao greeterDaoMock;

  @Test
  public void sayHello() {

    // Given
    when(greeterDaoMock.findGreeting()).thenReturn("Hola contigo, %s");

    // When
    String greeting = greeterService.sayHello("Duke");

    // Then
    assertThat(greeting).matches("Hola contigo, Duke");
  }

  @Configuration
  static class BadTestConfig {

    @Bean
    GreeterService greeterService() {
      return new GreeterService();
    }

    @Bean
    GreeterDao greeterDao() {
      return mock(GreeterDao.class);
    }
  }
}
[/code]
This test cannot even start the application context: Spring emits an error stating that it cannot find a bean of type <em>AnnoyingBean</em>. Now what the heck is this? Clearly I just want to have a mock of my <em>GreeterDao</em>, so why is Spring attempting to inject <em>AnnoyingBean</em>? 

Well, Spring attempts to inject it because the mock is based on the actual <em>GreeterDao</em> class and not some common <em>AbcDao</em> interface. And since the mock is based on the class, then by inheritance it also has the <em>@Autowired</em> member. And once my bean object (the mock) gets returned by <em>BadTestConfig::greeterDao()</em>, then Spring will attempt to initialise it: injecting any dependencies to other beans and run any <em>@PostConstruct</em> lifecycle methods.

So there it is: spring treats the mock as any other bean.

<h3>Solution: Spring Boot based code</h3>
If you are using Spring Boot and have these kind of problems, then it is very likely just because you are not creating the mocks using Spring Boots awesome <em>@MockBean</em> annotation:
[code language="java"]
@RunWith(SpringRunner.class)
@SpringBootTest(classes = {GreeterService.class, GreeterDao.class})
public class SpringBootPoweredGreeterServiceTests {

  @Autowired
  private GreeterService greeterService;

  @MockBean
  private GreeterDao greeterDaoMock;

  @Test
  public void sayHello() {

    // Given
    when(greeterDaoMock.findGreeting()).thenReturn("Hola contigo, %s");

    // When
    String greeting = greeterService.sayHello("Duke");

    // Then
    assertThat(greeting).matches("Hola contigo, Duke");
  }

}
[/code]
The <em>@MockBean</em> injection here ensures that Spring Boot correctly produces a mock that doesn't get post processed.

Spring Boot: simple as always :).

<h3>Solution: Core Spring Framework based code</h3>
The trick is here to ensure that Spring won't post process your mock. It just happens to be, that <em>FactoryBean</em>s have that behaviour:

[code language="java"]
@RunWith(SpringRunner.class)
@ContextConfiguration(classes = AwesomeTestConfig.class)
public class SolutionWithoutSpringBootGreeterServiceTests {

  @Autowired
  private GreeterService greeterService;

  @Autowired
  private GreeterDao greeterDaoMock;

  @Test
  public void sayHello() {

    // Given
    when(greeterDaoMock.findGreeting()).thenReturn("Hola contigo, %s");

    // When
    String greeting = greeterService.sayHello("Duke");

    // Then
    assertThat(greeting).matches("Hola contigo, Duke");
  }

  @Configuration
  static class AwesomeTestConfig {

    @Bean
    GreeterService greeterService() {
      return new GreeterService();
    }

    @Bean
    FactoryBean greeterDao() {
      return new AbstractFactoryBean() {
        @Override
        public Class getObjectType() {
          return GreeterDao.class;
        }

        @Override
        protected GreeterDao createInstance() {
          return mock(GreeterDao.class);
        }
      };
    }
  }
}
[/code]
Notice how <em>AwesomeTestConfig::greeterDao()</em> returns a bean factory instead of the mock directly. This test runs without error.

If you are going to use this trick, then make sure that you hide this ugly functionality away. You could, for example, invent a utility method with a nice signature. For example: <em>my.MockitoFactoryBean.create(Class clazzToMock)</em>. 

The workaround here also applies to XML based configuration. Just ensure you have that nice utility method - and then use that to define you bean.