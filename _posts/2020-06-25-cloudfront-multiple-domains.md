---
layout: post
title: "Host multiple Web sites from one S3 bucket using one CloudFront distribution"
description: "A brief summary of how to serve multiple WebApps from the same S3 bucket"
date: 2020-06-25
comments: true
tags: aws cloudfront s3 spa webapp
---

Here's how you can host multiple Web sites with custom domain names from a _single_ S3 bucket using 
a _single_ CloudFront distribution. For example: 

- `x.foo.com` > `My CloudFront Distribution` > `s3://my-bucket/x.foo.com`
- `y.foo.com` > `My CloudFront Distribution` > `s3://my-bucket/y.foo.com`

The secret ingredient is to implement a very simple Lambda@Edge "trigger" for "origin requests".

Motivation: You may be able to provision Web sites faster this way. That was my original mission at
least. If this works for you, then I would love to know (please add a comment below).

## Before you proceed
If you want to handle multiple domains, then ensure that you have created A-records for them
to your CloudFront distribution. The same domain names must be registered as 
`Alternate Domain Names (CNAMEs)` for your CloudFront distribution (see tab `General`).

Say you have, `x.foo.com` and `y.foo.com`: then also ensure you have registered a proper 
wildcart certificate for `*.foo.com`. That, again, must be registered on your CloudFront 
distribution (see `SSL Certificate`  on tab `General`).

## Step 1 of 2: Forward the Host header
The Lambda@Edge function needs access to the domain name used in inbound requests, to ensure that 
content is served from the appropriate S3 bucket path.

In order for the Lambda@Edge function to get this information, you must forward the `Host` header 
to the origin service (S3 in this case). Within your CloudFront distribution: 
  - Open tab: `Behaviors`
  - Edit the default behavior
  - Section: `Cache Based on Selected Request Headers`: Whitelist
  - Write `Host` and click on `Add Custom >>`
  - Save by clicking `Yes, Edit`

If you fail to complete this step, then the `Host` header you'll get inside the Lambda function is
that of the origin - i.e. the S3 origin endpoint. 

## Step 2 of 2: Implement the Lambda@Edge trigger

Create a Lambda@Edge function with the following contents:

```javascript
exports.handler = (event, context) => {
  
  const { request } = event.Records[0].cf;
  const domainName = request.headers.host[0].value;

  // This is the trick: Override the S3 bucket path from where CloudFront fetches your resources
  request.origin.s3.path = `/${domainName}`;

  // Restore the 'Host' HTTP header. Otherwise S3 will fail with a signature verification error
  request.headers.host[0].value = 'my-bucket.s3.amazonaws.com';

  return request;
}
```

Now, associate it with your CloudFront distribution: 
  - Open tab: `Behaviors`
  - Edit the default behavior
  - Section: `Lambda Function Associations`
  - Choose `CloudFront Event` = `Origin Request`
  - Enter the ARN, including the version number (!), to the Lambda@Edge function
  - Save by clicking `Yes, Edit`


### References
[cloudfront-triggers] [Adding Triggers for a Lambda@Edge Function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-add-triggers.html)
