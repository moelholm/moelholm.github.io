---
layout: post
title: "Spring Boot: Enhance your logging"
date: 2016-08-16
---

In this post I show how you can tune your Spring Boot application's logging output - such that it has even more information when you need to troubleshoot. The method is actually so generic that you can apply it to other types of Java applications as well - for example Java EE applications.
<h3>What you have today</h3>
Firstly: what is wrong with the default logging we get in Spring Boot? Nothing, actually - but it <em>can</em> be better. As an example, let us consider the log output from a RESTful resource invocation to <em>/greetings/duke</em> which returns a plain text greeting:
<pre>2016-08-16 21:57:56.269 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingController : Request received. PathVariable is: [duke]
2016-08-16 21:57:56.271 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingRepository : Retrieving standard greeting from the "datastore"
2016-08-16 21:57:56.271 INFO 29817 --- [o-auto-1-exec-1] com.moelholm.GreetingService : Formatting greeting for [duke]</pre>
There are 3 log lines: from <em>GreetingController</em>, <em>GreetingService and GreetingRepository</em>. Now imagine a system with 30 simultaneous active users that perform such invocations:
<ul>
	<li>The log lines would be mixed from the different concurrent threads - making it rather difficult to reason about the sequence of events. The thread names do help us - but even they get reused: the typical web container re-uses the same threads for serving different requests. Effectively meaning that if we filter the logs for, say <em>o-auto-1-exec-1</em>, we would get all log lines ever served by that thread.</li>
	<li>It is not possible to relate the log lines to the actual users. We really don't know <em>which</em> user caused <em>what</em> log lines.</li>
</ul>
<h3>What you can get</h3>
This is better:
<pre>2016-08-16 22:17:34.408 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingController : Request received. PathVariable is: [duke]
2016-08-16 22:17:34.409 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingRepository : Retrieving standard greeting from the "datastore"
2016-08-16 22:17:34.409 [userId:tux | requestId:3e21b7f3-3ba9-49b9-8390-4ab8987f995f] INFO 30158 --- [o-auto-1-exec-1] com.moelholm.GreetingService : Formatting greeting for [duke]</pre>
Here we have the same 3 log lines as before. But this time we can see that they belong to the same HTTP request: the request with id <em>3e21b7f3-xxxxx</em>. We can also see that it is the user <em>tux</em> that caused these log lines.

The naive solution would be for you to prepend the <em>userId</em> and <em>requestId</em> to all log lines. But that's never going to happen. You will forget it. If not you - then your colleague. And it can even be difficult to get such information from subcomponents - for example the <em>GreetingRepository</em>: how does it know about the <em>requestId</em>? Don't even consider using <em>ThreadLocal</em>'s now :).

The solution to get such "omni present" logging data is: <em>Mapped Diagnostic Context (MDC). </em>MDC is a feature that is supported in the most modern Java logging frameworks, for example: <em>Log4j</em>, <em>Log4j2</em>, <em>Logback</em> and more.

If you want to dig further into MDC, then take a look at <em>Logbacks</em> online documentation [1].
<h3>How you get that in Spring Boot</h3>
It's easy. First you tell Spring Boot <em>what</em> MDC data to render:
<pre>logging.pattern.level=%X{mdcData}%5p</pre>
Put this in <em>src/main/resources/application.properties. </em>Or supply it in any other way supported by the flexible configuration mechanism in Spring Boot. This property tells Spring Boot to render the MDC data variable <em>mdcData</em> just before the priority field in the log output. The priority field is the logging level (DEBUG, INFO, ...) that you are used to see.

Then you maintain the MDC data variable <em>mdcData</em> using your logging API - here using SLF4J (over the default Logback provider in Spring Boot):

[code language="Java"]
@Component
public class RequestFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            // Setup MDC data:
            String mdcData = String.format("[userId:%s | requestId:%s] ", user(), requestId());
            MDC.put("mdcData", mdcData); //Variable 'mdcData' is referenced in Spring Boot's logging.pattern.level property 
            chain.doFilter(request, response);
        } finally {
           // Tear down MDC data:
           // ( Important! Cleans up the ThreadLocal data again )
           MDC.clear();
        }
    }
[/code]

Here we maintain the MDC data in a Servlet <em>Filter</em>. That is an excellent place to maintain it - if we work with HTTP requests (REST, SOAP, JSP, Servlet, Thymeleaf, ...). If you have JMS listeners in your application - then you'll need to maintain the MDC data there too. Same applies with Quartz Jobs. And so on.
<blockquote>You decide what you want in the MDC data.

Anything goes: URL, session id, request id, user id, ip address, ...</blockquote>
I chose to exemplify the use of MDC data with a user id and an HTTP request id generated when receiving inbound HTTP requests. I like the idea of generating a unique request id (for HTTP, JMS, etc). Especially if you serve it back to the caller's when Exceptions occur. Given such an ID you can easily find all relevant log output related to that problem. I also like the user id: it easily gives you an overview of what a certain user has been doing in the application. But please decide what works for you - I am certain you can find additional useful data to put in the MDC.

I prepared a <a href="https://github.com/nickymoelholm/smallexamples/tree/master/enhanced-logging" target="_blank">GitHub example</a> for your convenience - take a look at that for a working example. Or if you just want to look at the above code examples in their full context.
<h3>Not using Spring Boot?</h3>
Not using Spring Boot? Then consult your logging frameworks documentation. The entire concept, MDC, is not at all tied to Spring Boot. In fact: MDC existed in Log4j long before Spring Boot was created.
<h3>References</h3>
[1] Logback - Chapter 8: Mapped Diagnostic Context
http://logback.qos.ch/manual/mdc.html

 