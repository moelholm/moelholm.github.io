---
layout: post
title: "Spring Boot: Sessions actuator endpoint"
description: "Implementing a custom actuator endpoint that prints information about all active HTTP sessions"
date: 2016-08-22
---

This post shows how you can implement a custom Spring Boot Actuator endpoint that prints information about all active <em>HttpSession</em>s:

<img class="alignnone size-full wp-image-1406" src="https://moelholm.files.wordpress.com/2016/08/screen-shot-2016-08-22-at-22-23-45.png" alt="Screen Shot 2016-08-22 at 22.23.45" width="1176" height="836" />

<em>HttpSession</em> meta data is prefixed with @ signs: id, creation time and last accessed time. The other values are a raw dump of all the <em>HttpSession</em> attributes.

You can use this endpoint during development to inspect active sessions. Or you can use it on production systems when troubleshooting customer issues. Whatever you choose, make sure that you secure such an endpoint appropriately: You could expose some very sensitive data.

For an introduction to custom Spring Boot Actuator endpoints, refer to my previous post: <a href="http://moelholm.com/2016/08/18/spring-boot-introduce-your-own-insight-endpoints/" target="_blank">Spring Boot: Introduce your own insight endpoints</a>.
<h3>Implementation</h3>
I have prepared a GitHub example based on Spring Boot 1.4 - <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-actuator-sessionsmvcendpoint" target="_blank">find it here</a>. Consult that to see the code in it's entirety and full context. Here's the main principles that makes this possible:
<ul>
	<li>Create a class to act as a registry of all active <em>HttpSession</em>s</li>
	<li>Create an <em>HttpSession</em> listener that registers and de-registers the <em>HttpSession</em>s</li>
	<li>Create a Spring Boot Actuator endpoint that dumps the internal state of all of the <em>HttpSession</em>s</li>
</ul>
<h4>Step 1 of 3: Class SessionRegistry</h4>
[code language="java"]
@Service
public class SessionRegistry {

    private final Map<String, HttpSession> httpSessionMap = new ConcurrentSkipListMap<>();

    public void addSession(HttpSession httpSession) {
        this.httpSessionMap.put(httpSession.getId(), httpSession);
    }

    public void removeSession(HttpSession httpSession) {
        this.httpSessionMap.remove(httpSession.getId());
    }

    public List<HttpSession> getSessions() {
        return new ArrayList<>(httpSessionMap.values());
    }
}
[/code]
The <em>httpSessionMap</em> is a concurrent version of <em>Map</em>: to avoid <em>ConcurrentModificationExceptions</em>.
<h4>Step 2 of 3: Class SessionListener</h4>
[code language="java"]
@Component
public class SessionListener implements HttpSessionListener {

    @Autowired
    private SessionRegistry sessionRegistry;

    @Override
    public void sessionCreated(HttpSessionEvent se) {
        sessionRegistry.addSession(se.getSession());
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        sessionRegistry.removeSession(se.getSession());
    }
}
[/code]
This is a Spring'ified version of a traditional Servlet container component: <em>HttpSessionListener</em>. This class maintains the registry.
<h4>Step 3 of 3: Class SessionActuatorEndpoint</h4>
This is the interesting part - where we create a Spring Boot Actuator endpoint:

[code language="java"]
@Component
public class SessionsActuatorEndpoint extends AbstractMvcEndpoint {

    @Autowired
    private SessionRegistry sessionRegistry;

    public SessionsActuatorEndpoint() {
        super("/sessions", true/*sensitive*/);
    }

    @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public SessionStateActuatorEndpointResponse listActiveSessions() {
        return new SessionStateActuatorEndpointResponse("Active HTTP sessions", sessionRegistry.getSessions());
    }

    @JsonPropertyOrder({"info", "numberOfActiveSessions", "sessions"})
    public static class SessionStateActuatorEndpointResponse {

        @JsonProperty
        private String info;

        @JsonProperty
        private int numberOfActiveSessions;

        @JsonProperty
        private List<Map<String, String>> sessions;

        public SessionStateActuatorEndpointResponse(String info, List<HttpSession> httpSessions) {
            this.info = info;
            this.numberOfActiveSessions = httpSessions.size();
            this.sessions = httpSessions.stream()
                    .map(this::getSessionState)
                    .collect(Collectors.toList());
        }

        private Map<String, String> getSessionState(HttpSession httpSession) {
            Map<String, String> sessionState = new LinkedHashMap<>();
            sessionState.put("@session_id", httpSession.getId());
            sessionState.put("@session_creation_time", formatDateTime(httpSession.getCreationTime()));
            sessionState.put("@session_last_accessed_time", formatDateTime(httpSession.getLastAccessedTime()));
            for (Enumeration<String> attributeNames = httpSession.getAttributeNames(); attributeNames.hasMoreElements(); ) {
                String attributeName = attributeNames.nextElement();
                Object attributeValue = httpSession.getAttribute(attributeName);
                sessionState.put(attributeName, attributeValue instanceof String || attributeValue instanceof Number ?
                        attributeValue.toString() : ReflectionToStringBuilder.toString(attributeValue));
            }
            return sessionState;
        }

        private String formatDateTime(long epoch) {
            Instant instant = Instant.ofEpochMilli(epoch);
            ZonedDateTime zonedDateTime = ZonedDateTime.ofInstant(instant, ZoneId.systemDefault());
            return zonedDataTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }
    }

}
[/code]
The thing that makes this a Spring Boot Actuator endpoint is that it declares <em>AbstractMvcEndpoint</em> as its superclass. Also take note of the constructor: this is where you register the path at which this endpoint can be found ('<em>/sessions</em>').

The inner class <em>SessionStateActuatorEndpointResponse</em> represents the JSON response structure. I've selected some meta data that I find interesting and added that in the output - prefixed with '@' characters. Other than that, it simply dumps all <em>HttpSession</em> attributes. Notice that it uses commons <em>ReflectionToStringBuilder</em> for object structures other than <em>String</em>s and <em>Number</em>s.

 