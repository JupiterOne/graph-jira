# Development

## Prerequisites

This integration uses a wrapper for Jira API maintained
[here](https://github.com/jira-node/node-jira-client).

## Provider account setup

You can get a free Jira Cloud account on [Jira's website][free-hosted].

### For X64

[Jira Data Center][data-center] (self-hosted) can be downloaded and executed
locally, following the setup instructions in the download.

First-time installs will be offered a free evaluation license. This has been
sufficient for development so far. It is possible also to purchase a Starter
License, though it will be associated to a single Server ID. [Getting started
with Jira Software Data Center][data-center-start] provides additional details.

```sh
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-8.jdk/Contents/Home
export JIRA_HOME=/Users/aiwilliams/Workspaces/jira-home
cd ~/Downloads/atlassian-jira-software-8.20.3-standalone
./bin/start-jira.sh
open http://localhost:8080
```

### For ARM64

In order to run [Jira Data Center][data-center] on ARM64 architecture, you must
use Docker. Atlassian has an [official docker image][jira-software-dockerhub]
for jira software. This can be run right out of the box for X64 Architecture.
However, in order to run smoothly on ARM64, you must build a custom image for
it. See the `Building on the target architecture` section of the dockerhub docs.

example:

```sh
git clone --recurse-submodule https://bitbucket.org/atlassian-docker/docker-atlassian-jira.git
cd docker-atlassian-jira
docker build --tag jira-arm64-v8.20.1 --build-arg JIRA_VERSION=8.20.1 .
docker volume create --name jiraVolume
docker run -v jiraVolume:/var/atlassian/application-data/jira --name="jira" -d -p 8080:8080 jira-arm64-v8.20.1
```

After you have successfully bootstrapped the local Jira server:

1. During setup, allow the onboarding wizard to create a populated project
   having the name `SP`.
2. Create a new user `jupiterone-dev`.
3. `cp .env.example .env` and verify configuration values.
4. `LOAD_ENV=1 yarn test` to make new recording using the configuration.

## Authentication

The first version of the integration used a simple host/username/password
authentication method. However, Jira supports OAuth, and we should change to it
at some point. For more, see [Jira and OAuth][jira-oauth].

It looks like the Jira client wrapper for the REST API that we are using already
supports OAuth. From the client constructor: options.oauth = { consumer_key:
options.oauth.consumer_key, consumer_secret: options.oauth.consumer_secret,
token: options.oauth.access_token, token_secret:
options.oauth.access_token_secret, signature_method:
options.oauth.signature_method || 'RSA-SHA1' };

If we passed this oauth object instead of the username and password params, it
should use the OAuth flow. However, this would require migrating existing
customers to OAuth, or writing code that checks the customer config and
configures which authen to use.

With the basic username/password authentication currently in place, there
appears to be no timeout on the credentials.

[free-hosted]: https://www.atlassian.com/software/jira/free
[data-center]: https://www.atlassian.com/software/jira/download-journey
[data-center-start]:
  https://confluence.atlassian.com/enterprise/getting-started-with-jira-software-data-center-948226882.html
[jira-oauth]:
  https://developer.atlassian.com/server/jira/platform/jira-rest-api-example-oauth-authentication-6291692/
[jira-software-dockerhub]: https://hub.docker.com/r/atlassian/jira-software
