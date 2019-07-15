---
layout: post
title: "Spring Boot: Controlling timezones with Hibernate"
description: "Controlling the timezone used by Hibernate when it communicates timestamps with the database"
date: 2016-11-09
comments: true
tags: java spring spring-boot hibernate jpa
---

In this post I show how you, from a Spring Boot application, can control the timezone used by Hibernate when it communicates timestamps with the database.
<blockquote class="blockquote">This post is inspired by a very similar recent post by Vlad Mihalcea [1], Hibernate Developer Advocate at Redhat.

It's basically the same subject - but with a Spring Boot focus. So read on, if you want to get a "ready-to-use" recipe for controlling the timezones used by JPA/Hibernate in your Spring Boot applications.</blockquote>
I will show the technique in the context of a Spring Boot 1.4.2 application.

Just looking for the solution? Then scroll down to _Solution 2: Configuring Hibernate to control the timezone_.

### Motivation
On the job I was recently developing a JPA 2 powered database integration: I decided that the application should store timestamps in UTC. Effectively the same end result as deciding that it should run in the GMT timezone. UTC is strictly speaking not a timezone - if you want to be nitty-gritty [2].

It turns out that this is a very annoying situation. Until very recently, with Hibernate, you basically only had one solution: Configuring the JVM's default timezone. More about that next.

### Solution 1: Configuring the JVM's default timezone
Here is one way to fix the problem: Put the JVM's default timezone into UTC. Like this, if you launch a Spring Boot runnable JAR:

```code
java -Duser.timezone=UTC -jar build/libs/springboot-hibernate-timezones.jar
```

Or from inside your Spring Boot application, like this:

```java
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
```

You could also put the `TimeZone` code into the `main` method. But putting the `TimeZone` code into a `@PostConstruct` callback like this, ensures that it is also effective when you run tests or wrap up the application as a Web ARchive (WAR). Be careful about competing with other initializer methods that use JPA during startup.

In fact, as of writing this post (November 2016), setting the default timezone is the only truly portable solution for vanilla JPA solutions. JPA doesn't allow you to control this.
<blockquote class="blockquote">If you use another JPA provider (than Hibernate) then this is still the way to go.</blockquote>

This solution works. But it is very invasive and has a few potential drawbacks. 

Firstly, what if your JVM cannot be put into the timezone you desire for your database? Perhaps another default timezone is required by other parts of your application. Perhaps it is outside your control. That could easily be the case if your application is colocated with other applications in a shared application server for example.

Secondly, what if you need to access different databases - and they, for whatever reason, need timestamps to be stored in different timezones? 

### Solution 2: Configuring Hibernate to control the timezone
The previous solution is like solving the problem with a bazooka. Luckily, Vlad Mihalcea recently updated Hibernate itself to support this usecase. Even better:
<blockquote class="blockquote">The Hibernate specific configuration solution is a much more powerful solution</blockquote>
It is more powerful because you can choose to configure a specific `SessionFactory` (think JPA `EntityManagerFactory`) and even a specific `Session` (think JPA `EntityManager`). What a fantastic update! Find more details in Vlad Mihalcea's post [1].

I have prepared a working Spring Boot example <a href="https://github.com/nickymoelholm/smallexamples/tree/master/springboot-hibernate-timezones" target="_blank">on GitHub</a> - consult that to see the code in its entirety and true surroundings. These are the 2 steps you need to complete...

#### Step 1 of 2: Upgrade Hibernate
The Hibernate version shipped with Spring Boot 1.4.2 is 5.0.11.Final. That's not new enough. So start by upgrading Spring Boot to use Hibernate 5.2.3.Final or newer.

From the example on GitHub - in Gradle:

```groovy
...

// So we get Hibernates time zone configuration option (released October 2016):
ext['hibernate.version'] = '5.2.3.Final'

...
```

That's how Hibernate get's upgraded.

####Step 2 of 2: Configure Hibernate to control the timezone
With Spring Boot this is a breeze. Add a property in `application.properties`:

```code
spring.jpa.properties.hibernate.jdbc.time_zone = UTC
```

Done.

By the way: The example on GitHub uses a YAML file instead. It looks slightly different - but same principle in another syntax.

#### Test it
The example on GitHub includes a minimal test of the Hibernate configuration. 

Firstly, a JPA entity:

```java
@Entity
class Message {

  @Id // Don't do this at home...
  private String message;

  @Column
  private LocalDateTime created;

  // ... Getters and setters && a few constructors

}
```

Secondly, a JPA repository - Spring Data style:

```java
interface MessageRepository extends CrudRepository<Message, String> {
}
```

And finally, the integration test:

```java
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
```

First, consider that the default timezone is set to GMT+2 (see the static initializer). Then notice that a `LocalDateTime` is created in this context. Finally notice the "Then" part: the database receives a `LocalDateTime` that is 2 hours before the `LocalDateTime` being inserted. 

And there you have it: Hibernate automatically translates the `LocalDateTime` from GMT+2 into GMT (=UTC) when communicating with the database.

#### BONUS TIP: Getting the Hibernate configuration to work with MariaDB / MySQL
Well, that didn't work for me.

To begin with at least. It turns out that MariaDB / MySQL by default runs in a `useLegacyDatetimeCode=true` mode. You need to deactivate it for Hibernate to be able to do it's magic. Luckily that's easy, just configure it in the JDBC connection URL:

```code
jdbc:mysql://localhost:3306/mysql?useLegacyDatetimeCode=false
```

Why? I debugged the driver to find out what was happening. It turns out that the `Calendar` objects Hibernate send to the JDBC API gets completely ignored. When the driver runs in the `useLegacyDatetimeCode=true` mode, which is default. The driver get's the argument - and then simply choose to make another `Calendar` like this: `Calendar.getInstance()`. The effect of that, is that the driver uses the timezone that is default to the JVM.

Notice that the MariaDB / MySQL JDBC drivers also support another argument: `serverTimezone=TIMEZONEHERE`. Set that to GMT, skip the Hibernate configuration, and you have another solution. This time, however, tightly bound to the specific driver.

### How Hibernate controls the timezone

Hibernate controls the timezone on the JDBC API layer. 

The example I created used a `LocalDateTime`. The JDBC API doesn't support `LocalDateTime`, so Hibernate translates that into a `java.sql.Timestamp` before it sends it to the `PreparedStatement.setTimestamp(int parameterIndex, Timestamp x, Calendar cal)` method. 

Notice the `Calendar` argument. In Java `Calendar`s are `TimeZone` aware. The `Calendar` Hibernate sends into the method is in the timezone that you specify.

Likewise, when Hibernate reads from the database again it sends the `Calendar` into `ResultSet.getTimestamp(int columnIndex, Calendar cal)`. 

I have illustrated this in a simulation - find it on GitHub too:

```java
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
```

The test is almost the same as the JPA version. This time it uses raw JDBC to document the machinery.

### Reflection
I am actually puzzled that the configuration now offered by Hibernate hasn't already been baked into the JPA specification. I suggested it on Twitter for some of the top Hibernate/JPA influencers and it seems like they could see the point in that [3].

Who knows, one day we may have this feature in JPA? 

### References
[1] [How to store timestamps in UTC using the new hibernate.jdbc.time_zone configuration property](http://in.relation.to/2016/09/12/jdbc-time-zone-configuration-property/)

[2] [UTC – The World's Time Standard](https://www.timeanddate.com/time/aboututc.html)

[3] [Twitter - Why didn't this feature go into JPA?](https://twitter.com/moelholm/status/794876824618749952)