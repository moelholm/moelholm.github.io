---
layout: post
title: "Spring Boot: Controlling timezones with Hibernate"
date: 2016-11-09
---

In this post I show how you, from a Spring Boot application, can control the timezone used by Hibernate when it communicates timestamps with the database.
<blockquote>This post is inspired by a very similar recent post by Vlad Mihalcea [1], Hibernate Developer Advocate at Redhat.

It's basically the same subject - but with a Spring Boot focus. So read on, if you want to get a "ready-to-use" recipe for controlling the timezones used by JPA/Hibernate in your Spring Boot applications.</blockquote>
I will show the technique in the context of a Spring Boot 1.4.2 application.

Just looking for the solution? Then scroll down to <em>Solution 2: Configuring Hibernate to control the timezone</em>.
<h3>Motivation</h3>
On the job I was recently developing a JPA 2 powered database integration: I decided that the application should store timestamps in UTC. Effectively the same end result as deciding that it should run in the GMT timezone. UTC is strictly speaking not a timezone - if you want to be nitty-gritty [2].

It turns out that this is a very annoying situation. Until very recently, with Hibernate, you basically only had one solution: Configuring the JVM's default timezone. More about that next.
<h3>Solution 1: Configuring the JVM's default timezone</h3>
Here is one way to fix the problem: Put the JVM's default timezone into UTC. Like this, if you launch a Spring Boot runnable JAR:

[code]
java -Duser.timezone=UTC -jar build/libs/springboot-hibernate-timezones.jar
[/code]

Or from inside your Spring Boot application, like this:

[code language="java"]
@SpringBootApplication
public class Application {

  @PostConstruct
  void started() {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
  }

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

}
[/code]

You could also put the <em>TimeZone</em> code into the <em>main</em> method. But putting the <em>TimeZone</em> code into a <em>@PostConstruct</em> callback like this, ensures that it is also effective when you run tests or wrap up the application as a Web ARchive (WAR). Be careful about competing with other initializer methods that use JPA during startup.

In fact, as of writing this post (November 2016), setting the default timezone is the only truly portable solution for vanilla JPA solutions. JPA doesn't allow you to control this.
<blockquote>If you use another JPA provider (than Hibernate) then this is still the way to go.</blockquote>

This solution works. But it is very invasive and has a few potential drawbacks. 

Firstly, what if your JVM cannot be put into the timezone you desire for your database? Perhaps another default timezone is required by other parts of your application. Perhaps it is outside your control. That could easily be the case if your application is colocated with other applications in a shared application server for example.

Secondly, what if you need to access different databases - and they, for whatever reason, need timestamps to be stored in different timezones? 

<h3>Solution 2: Configuring Hibernate to control the timezone</h3>
The previous solution is like solving the problem with a bazooka. Luckily, Vlad Mihalcea recently updated Hibernate itself to support this usecase. Even better:
<blockquote>The Hibernate specific configuration solution is a much more powerful solution</blockquote>
It is more powerful because you can choose to configure a specific <em>SessionFactory</em> (think JPA <em>EntityManagerFactory</em>) and even a specific <em>Session</em> (think JPA <em>EntityManager</em>). What a fantastic update! Find more details in Vlad Mihalcea's post [1].

I have prepared a working Spring Boot example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-hibernate-timezones" target="_blank">on GitHub</a> - consult that to see the code in its entirety and true surroundings. These are the 2 steps you need to complete...

<h4>Step 1 of 2: Upgrade Hibernate</h4>
The Hibernate version shipped with Spring Boot 1.4.2 is 5.0.11.Final. That's not new enough. So start by upgrading Spring Boot to use Hibernate 5.2.3.Final or newer.

From the example on GitHub - in Gradle:

[code language="Groovy"]
...

// So we get Hibernates time zone configuration option (released October 2016):
ext['hibernate.version'] = '5.2.3.Final'

...
[/code]

That's how Hibernate get's upgraded.
<h4>Step 2 of 2: Configure Hibernate to control the timezone</h4>
With Spring Boot this is a breeze. Add a property in <em>application.properties</em>:

[code language="java"]
spring.jpa.properties.hibernate.jdbc.time_zone = UTC
[/code]

Done.

By the way: The example on GitHub uses a YAML file instead. It looks slightly different - but same principle in another syntax.

<h4>Test it</h4>
The example on GitHub includes a minimal test of the Hibernate configuration. 

Firstly, a JPA entity:

[code language="java"]
@Entity
class Message {

  @Id // Don't do this at home...
  private String message;

  @Column
  private LocalDateTime created;

  // ... Getters and setters && a few constructors

}
[/code]

Secondly, a JPA repository - Spring Data style:

[code language="java"]
interface MessageRepository extends CrudRepository<Message, String> {
}
[/code]

And finally, the integration test:

[code language="java"]
@RunWith(SpringRunner.class)
@SpringBootTest
public class JpaIntegrationTests {

  static {
    TimeZone.setDefault(TimeZone.getTimeZone("GMT+2"));
  }

  @Autowired
  private MessageRepository messageRepository;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private Environment e;

  @Test
  public void testJpa() {

    //
    // Given
    //

    // 1) This is the datetime we will insert
    LocalDateTime localDateTime = LocalDateTime.of(2017, Month.JANUARY, 1, 0, 0, 0);

    // 2) This is the datetime we expect the database to receive
    LocalDateTime gmtDateTime = LocalDateTime.of(2016, Month.DECEMBER, 31, 22, 0, 0);

    //
    // When
    //

    messageRepository.save(new Message("Hello World from JPA", localDateTime));

    //
    // Then
    //

    Message fromDatabase = messageRepository.findOne("Hello World from JPA");

    // 1) Datetime is unchanged
    assertThat(fromDatabase.getCreated()).isEqualTo(localDateTime);

    // 2) We expect the database to store the datetime in the GMT timezone ( == UTC )
    jdbcTemplate.query("select " + formatDate(e, "created") + " from message", rs -> {
      assertThat(LocalDateTime.parse(rs.getString(1))).isEqualTo(gmtDateTime);
    });

  }

}
[/code]

First, consider that the default timezone is set to GMT+2 (see the static initializer). Then notice that a <em>LocalDateTime</em> is created in this context. Finally notice the "Then" part: the database receives a <em>LocalDateTime</em> that is 2 hours before the <em>LocalDateTime</em> being inserted. 

And there you have it: Hibernate automatically translates the <em>LocalDateTime</em> from GMT+2 into GMT (=UTC) when communicating with the database.

<h4>BONUS TIP: Getting the Hibernate configuration to work with MariaDB / MySQL</h4>
Well, that didn't work for me.

To begin with at least. It turns out that MariaDB / MySQL by default runs in a <em>useLegacyDatetimeCode=true</em> mode. You need to deactivate it for Hibernate to be able to do it's magic. Luckily that's easy, just configure it in the JDBC connection URL:

[code]
jdbc:mysql://localhost:3306/mysql?useLegacyDatetimeCode=false
[/code]

Why? I debugged the driver to find out what was happening. It turns out that the <em>Calendar</em> objects Hibernate send to the JDBC API gets completely ignored. When the driver runs in the <em>useLegacyDatetimeCode=true</em> mode, which is default. The driver get's the argument - and then simply choose to make another <em>Calendar</em> like this: <em>Calendar.getInstance()</em>. The effect of that, is that the driver uses the timezone that is default to the JVM.

Notice that the MariaDB / MySQL JDBC drivers also support another argument: <em>serverTimezone=TIMEZONEHERE</em>. Set that to GMT, skip the Hibernate configuration, and you have another solution. This time, however, tightly bound to the specific driver.

<h3>How Hibernate controls the timezone</h3>

Hibernate controls the timezone on the JDBC API layer. 

The example I created used a <em>LocalDateTime</em>. The JDBC API doesn't support <em>LocalDateTime</em>, so Hibernate translates that into a <em>java.sql.Timestamp</em> before it sends it to the <em>PreparedStatement.setTimestamp(int parameterIndex, Timestamp x, Calendar cal)</em> method. 

Notice the <em>Calendar</em> argument. In Java <em>Calendar</em>s are <em>TimeZone</em> aware. The <em>Calendar</em> Hibernate sends into the method is in the timezone that you specify.

Likewise, when Hibernate reads from the database again it sends the <em>Calendar</em> into <em>ResultSet.getTimestamp(int columnIndex, Calendar cal)</em>. 

I have illustrated this in a simulation - find it on GitHub too:

[code language="java"]
@RunWith(SpringRunner.class)
@SpringBootTest
public class JdbcIntegrationTests {

  static {
    TimeZone.setDefault(TimeZone.getTimeZone("GMT+2"));
  }

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private Environment e;

  @Test
  public void testJdbc() {

    //
    // Given
    //

    // 1) This Calendar ensures that Timestamps are stored in the specified timezone:
    //    > Ignored when using useLegacyDatetimeCode=true (which is default for MariaDB) <
    Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("GMT"));

    // 2) This is the datetime we will insert
    LocalDateTime localDateTime = LocalDateTime.of(2017, Month.JANUARY, 1, 0, 0, 0);

    // 3) This is the datetime we expect the database to receive
    LocalDateTime gmtDateTime = LocalDateTime.of(2016, Month.DECEMBER, 31, 22, 0, 0);

    //
    // When
    //

    jdbcTemplate.update("insert into message values (?, ?)", ps -> {
      ps.setString(1, "Hello World from JDBC");
      ps.setTimestamp(2, Timestamp.valueOf(localDateTime), cal);
    });

    //
    // Then
    //

    // 1) We expect to get the datetime back in the JVM's timezone:
    jdbcTemplate.query("select * from message", rs -> {
      assertThat(rs.getTimestamp("created", cal).toLocalDateTime()).isEqualTo(localDateTime);
    });

    // 2) We expect the database to store the datetime in the GMT timezone ( == UTC )
    jdbcTemplate.query("select " + formatDate(e, "created") + " from message", rs -> {
      assertThat(LocalDateTime.parse(rs.getString(1))).isEqualTo(gmtDateTime);
    });

  }


}
[/code]

The test is almost the same as the JPA version. This time it uses raw JDBC to document the machinery.

<h3>Reflection</h3>
I am actually puzzled that the configuration now offered by Hibernate hasn't already been baked into the JPA specification. I suggested it on Twitter for some of the top Hibernate/JPA influencers and it seems like they could see the point in that [3].

Who knows, one day we may have this feature in JPA? 

<h3>References</h3>
[1] How to store timestamps in UTC using the new hibernate.jdbc.time_zone configuration property:
<a href="http://in.relation.to/2016/09/12/jdbc-time-zone-configuration-property/" target="_blank">http://in.relation.to/2016/09/12/jdbc-time-zone-configuration-property/</a>

[2] UTC – The World's Time Standard:
<a href="https://www.timeanddate.com/time/aboututc.html" target="_blank">https://www.timeanddate.com/time/aboututc.html</a>

[3] Twitter - Why didn't this feature go into JPA?
<a href="https://twitter.com/moelholm/status/794876824618749952" target="_blank">https://twitter.com/moelholm/status/794876824618749952</a>