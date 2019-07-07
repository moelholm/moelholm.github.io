---
layout: post
title: "Spring 4.3: Custom annotations"
description: "How to bend the Spring Framework - rolling out your own custom annotations"
date: 2016-10-15
---

In this post I will show you how to bend the Spring Framework a little bit. In particular I will show you how you can make code like this:

[code language="java"]
@BusinessService
public class GreeterService {

  @LocalizedMessage("greeterservice.greeting")
  private Message greetingMsg;

  public String sayHello(@NotNull String caller) {
    return greetingMsg.format(caller);
  }

}
[/code]

<em>@BusinessService</em> declares a perfectly valid Spring bean. It comes with the support for <em>@NotNull</em> parameter checks. <em>@NotNull</em> is from the bean validation API - no need to exercise too many keystrokes.

<em>@LocalizedMessage</em> is a perfectly valid injection capable annotation. Here we use that to inject a <em>Message</em> bean. This bean is context aware - it knows about the <em>@LocalizedMessage</em> annotation's value attribute. With this information, <em>Message</em> is used from method <em>sayHello</em> to return <em>Locale</em> aware messages. ( AWESOME TIP UNLOCKED ).

Please note that:
<blockquote>just because you can doesn't mean you should</blockquote>
Be careful about how creative you get when bending the Spring Framework. It could easily contribute to a codebase where only a few specialized authors understand what is really going on.

The next sections jumps right into the solution. I have prepared a working example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/spring43-custom-annotations" target="_blank">at GitHub</a>. Consult that to see the source code in it's entirety and true surroundings. The example is based in Spring Boot 1.4.1 and Spring Framework 4.3.3.
<h3>Test cases</h3>
Here's a few integration tests documenting how the service works:

[code language="java"]
@SpringBootTest
@RunWith(SpringRunner.class)
public class GreeterServiceIntegrationTests {

  @Autowired
  private GreeterService greeterService;

  @Test
  public void sayHello_whenInvoked_thenReturnsEnglishGreeting() {

    // Given
    String caller = "Duke";

    // When
    String greeting = greeterService.sayHello(caller);

    // Then
    assertThat(greeting).isEqualTo("Hello World, Duke");
  }

  @Test(expected = IllegalArgumentException.class)
  public void sayHello_whenInvokedWithNullArgument_thenThrowsIllegalArgumentException() {

    // Given
    String caller = null;

    // When
    greeterService.sayHello(caller);

    // Then
    // ( kapOOOf )
  }

  @Test
  public void sayHello_whenLocaleIsDanish_andInvoked_thenReturnsDanishGreeting() {

    // Given
    LocaleContextHolder.setLocale(new Locale("da", "DK"));
    String caller = "Duke";

    // When
    String greeting = greeterService.sayHello(caller);

    // Then
    assertThat(greeting).isEqualTo("Hej Verden, Duke");
  }

  @Before @After
  public void resetLocaleBeforeAndAfterEachTestCase() {
    LocaleContextHolder.setLocale(Locale.ENGLISH);
  }
}
[/code]
From the second test case, notice that the service apparently knows how to validate the incoming parameter.
From the first and the third test cases, notice that the service is locale aware.

<h3>The @BusinessService annotation</h3>
The <em>@BusinessService</em> annotation is a custom "stereotype" annotation. Spring already has a bunch of stereotype annotations, including: <em>@Service</em>, <em>@Controller</em>, <em>@Repository</em>, and so on. But you can also add your own - as in the case of <em>@BusinessService</em>:

[code language="java"]
@Component
@Retention(RetentionPolicy.RUNTIME)
public @interface BusinessService {
}
[/code]

The only thing that makes this annotation special is the <em>@Component</em> annotation. With that in place you can now use the <em>@BusinessService</em> annotation to declare Spring beans.

Spring Framework even allows you to meta-annotate your custom stereotype annotations with other framework annotations. For example with <em>@SessionScope</em> and <em>@Transactional</em>. If you annotate beans with such a <em>composed</em> annotation, then they would both be HTTP session scoped as well as transactional of nature. Consult the reference documentation for further information on that subject [1].
<h3>Enforcing @NotNull functionality</h3>
With the custom stereotype annotation in place you can now use it for something. What that "something" is, is entirely up to your imagination. But for this example I would like to ensure that <em>@BusinesService</em> components can benefit from automatic not-null parameter validation, by declaring <em>@NotNull</em> as hints. I have used Spring AOP for that in my example - it is extremely simple:

[code language="java"]
@Aspect
@Component
public class NotNullParameterAspect {

  @Before("@within(com.moelholm.spring43.customannotations.BusinessService)")
  public void before(JoinPoint caller) {

    Method method = getCurrentMethod(caller);

    Object[] parameters = caller.getArgs();

    Annotation[][] parameterAnnotations = method.getParameterAnnotations();

    // Throw exception if a parameter value is null AND
    // at the same time declares that it must be @NotNull
    for (int i = 0; i < parameters.length; i++) {
      Object parameterValue = parameters[i];
      Annotation[] annotationsOnParameter = parameterAnnotations[i];

      if (parameterValue == null && hasNotNullAnnotation(annotationsOnParameter)) {
        String msgTemplate = String.format("Parameter at index %s must not be null", i);
        throw new IllegalArgumentException(msgTemplate);
      }
    }

  }

  private boolean hasNotNullAnnotation(Annotation... annotations) {
    return Arrays.asList(annotations).stream().
              anyMatch(a -> a.annotationType() == NotNull.class);
  }

  private Method getCurrentMethod(JoinPoint joinPoint) {
    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    return signature.getMethod();
  }
}
[/code]

The <em>@Before</em> annotation tells spring that the method should be executed before any invocation on beans that are annotated with <em>@BusinessService</em>. The method body, the <em>advice</em>, throws an <em>IllegalArgumentException</em> if a parameter is null and <em>@NotNull</em> annotated at the same time.

It's just an example here. You could do anything in such an advice. In fact there are other types as well, including: <em>@After</em>, <em>@Around</em>, etc. Imagine what you could do with them...

Spring AOP is super powerful. I barely scratched the surface here. So if this is new to you - then check out the appropriate section in the reference documentation [2]. It can be a bit heavy - so remember to bring some dark coffee.
<h3>The custom dependency injection annotation: @LocalizedMessage</h3>
In a typical Spring application you pick between <em>@Autowired</em>, <em>@Resource</em>, <em>@Value</em>, <em>@Inject</em> when injecting a bean into another bean. But it's super easy to create your own:

[code language="java"]
@Autowired
@Retention(RetentionPolicy.RUNTIME)
public @interface LocalizedMessage {

  String value() default "";

}
[/code]

Take note of the <em>@Autowired</em> annotation. Without it, we would additionally have to specify one of the standard annotations on the injection targets as well, ie:<em> @Autowired @LocalizedMessage Message message</em>. Also take note of the <em>value</em> attribute - this is used to declare the name of the resource bundle key of interest.
<h3>Implementing the @LocalizedMessage support</h3>
In order for the <em>Message</em> bean to be injected it must be... well a bean. Here is how that is declared:

[code language="java"]
@Configuration
public class MessageConfig {

  @Bean
  public MessageSource messageSource() {

    ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
    messageSource.setBasename("messages");

    return messageSource;
  }

  @Bean
  @Scope(scopeName = ConfigurableBeanFactory.SCOPE_PROTOTYPE)
  public Message message(InjectionPoint ip) {

    LocalizedMessage localizedMessage = AnnotationUtils
        .getAnnotation(ip.getAnnotatedElement(), LocalizedMessage.class);

    String resourceBundleKey = localizedMessage.value();

    return new Message(messageSource(), resourceBundleKey);
  }

}
[/code]

Notice the <em>message</em> factory (/producer) method. It accesses the <em>InjectionPoint</em> class to fetch the resource bundle key of interest (fx. "<em>greeterservice.greeting</em>" declared in <em>GreeterService</em>). With that information and a valid <em>MessageSource</em> it then creates the <em>Message</em> bean.

Note that the scope of the <em>message</em> bean is <em>prototype</em>. It is very important for this case, as it ensures that each injection of <em>Message</em> is a new instance. Singleton scope here would have the effect that injections of <em>Message</em> beans would re-use the same instance (effectively tied to the same resource bundle message - despite the annotation key values at the injection targets).
<h3>In retrospective</h3>
The title claimed <em>"Spring 4.3: Custom annotations"</em>. To be honest, Spring Framework have had support for custom stereotypes for a long time. Many, many years. So that's not new. Neither is the Spring AOP support I've shown.

But take a look at the custom dependency injection part. The <em>InjectionPoint</em> class is what makes this possible - and that's a new thing, since Spring Framework 4.3 [3]. But even this part could have been implemented back in the old days: using a <em>BeanPostProcessor </em>[4]. But it would be a bit messy - at least compared to a simple <em>@Bean</em> factory method.
<h3>References</h3>
[1] @Component and further stereotype annotations:
<a href="http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/#beans-stereotype-annotations" target="_blank">http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/#beans-stereotype-annotations</a>

[2] Aspect Oriented Programming with Spring:
<a href="http://docs.spring.io/spring/docs/current/spring-framework-reference/html/aop.html" target="_blank">http://docs.spring.io/spring/docs/current/spring-framework-reference/html/aop.html</a>

[3] Spring 4.3: Introducing the InjectionPoint:
<a href="http://moelholm.com/blog/2016/10/09/spring-4-3-introducing-the-injectionpoint/" target="_blank">https://moelholm.com/2016/10/09/spring-4-3-introducing-the-injectionpoint/</a>

[4] BeanPostProcessor JavaDoc:
<a href="http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/config/BeanPostProcessor.html" target="_blank">http://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/config/BeanPostProcessor.html</a>