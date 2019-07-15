---
layout: post
title: "Kotlin: Understanding properties"
description: "How Kotlin properties look like at the JVM bytecode level"
date: 2017-03-26
comments: true
---

In this post I am going to look into Kotlin properties [1] from a Java developers perspective. By a few examples and by looking into the generated code.

I have created an example project <a href="https://github.com/nickymoelholm/smallexamples/tree/master/javadevelopers-understanding-kotlin-properties" target="_blank">on GitHub</a>. You will find a few examples of how to declare properties - and for each of them, also identical unit tests in Java and Kotlin. 

Let's demystify those properties 🙂

### Example: mutable and read-only properties

```kotlin
class First {
  var messageOne: String? = "one"
  val messageTwo = "two"
}
```

Keyword `var` is what makes `messageOne` mutable. It is also nullable (the question mark). Keyword `val` is what makes `messageTwo` read-only. 

Running `./gradlew build javap` in the example project compiles the code, runs the Kotlin/Java tests and ends up with the following `javap` dump:

```kotlin
public final class com.moelholm.First {
  private java.lang.String messageOne;
  private final java.lang.String messageTwo;

  public final java.lang.String getMessageOne();
  public final void setMessageOne(java.lang.String);

  public final java.lang.String getMessageTwo();

  public com.moelholm.First();
}
```

This is how it looks like from Java land. 

The `val` modifier in Kotlin is basically syntactic sugar for generating a `final` field plus a getter method. So that's how `val`s become read-only.

The `var` modifier in Kotlin ensures that we get a field plus a getter method and a setter method. So that's how `var`s become mutable.

The following two tests shows how we can use the properties from unit tests in Java...:

```kotlin
public class FirstTests {

  @Test
  public void test() {

    First first = new First();

    first.setMessageOne("Hello from Java");

    assertThat(first.getMessageOne()).isEqualTo("Hello from Java");

    assertThat(first.getMessageTwo()).isEqualTo("two");

  }

}
```

...as well as Kotlin:

```kotlin
class FirstTests {

  @Test
  fun test() {

    val first = First()

    first.messageOne = "Hello from Kotlin"

    assertThat(first.messageOne).isEqualTo("Hello from Kotlin")

    assertThat(first.messageTwo).isEqualTo("two")

  }

}
```

It is very visible from the Java unit test why you cannot update `messageTwo`: there is simply no setter method. 

Regarding _nullability_: You cannot see how that works by looking at the javap output above. But if you add a `-v` flag to it, then you will see that the bytecode comes with the following Constant Pool declarations: `Lorg/jetbrains/annotations/Nullable;` and `Lorg/jetbrains/annotations/NotNull;`. The Kotlin compiler uses these to annotate members with the desired _nullability_ behavior.

### There is much more...
There is more to Kotlin properties than shown in this post. 

For example Kotlin also has _delegated properties_ and _late initialized properties_. And it is possible to provide custom getter/setter functionality in the property declaration as well. 

Very interesting topics; subject for another post.

### References
[1] [Kotlin Reference: Properties](https://kotlinlang.org/docs/reference/properties.html)
