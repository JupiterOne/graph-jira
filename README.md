# JupiterOne Integration

Learn about the data ingested, benefits of this integration, and how to use it
with JupiterOne in the [integration documentation](docs/jupiterone.md). The
askJ1 community also has documentation on Jira integrations here:
[Jira integration with JupiterOne](https://community.askj1.com/kb/articles/1009-jira-integration-with-jupiterone)

## Development

### Prerequisites

Setup a new user in Jira:

1. This can be performed using the Atlassian cloud or a local install of Jira to create a new user for Basic auth or retrieving API tokens.
2. Access Jira with a user assigned to an admin group, select the Jira gear icon, then 
   select `System` and then the `User Management` link.
3. Select `Create User` button, and fill in the required fields. Be sure to check
   `Jira Software` in the `Application Access` section.
4. This user will be defaulted into the  `jira-software-users` group, which is the default
    group for Jira Software users. If this user is only to be used for the integration, then best practice for least priviledge is to not assign them to any additional admin or elevated groups.
5. After logging in, this new user can immediately be used to test the integration.
   Depending on the type Jira instance, follow the instructions below for Jira API access.

In the Atlassian cloud or locally installed Jira instance, the following
information is required:

For cloud based Jira instance to create an API token:

1. After logging into the Jira instance, use the Settings Gear icon to access Atlassian 
   account settings. From that page use the Security link to access the API token link to create and manage API tokens.
2. Select create API token, and when the API token dialog appears, assign a name
   to it; e.g. "J1-token".
3. Copy the new token value and keep it for the next section as the PASSWORD
   field to in the local `.env` file.
4. Copy the cloud URL from the browser, keeping only the
   `protocol://host.domain.tld` portion and keep it for the next section as the
   HOST field in the local `.env` file. Do not include a trailing slash `/`.

For local installed Jira:

1. This install assumes there is a running local Jira envirnment that can be accessed with 
   a browser.
2. Use the login name and password to login to Jira through the browser as the username and
   password values in the `.env` file below.
3. The API version for locally installed version of Jira is limited to `2`.
4. For a locally installed Jira, the URL value for the HOST field will be
   similar to `http://localhost:8088`.

For either install use the `Projects` menu at top of the Jira page, and a
   project key name can be optionally be selected to be used in the next section to
   setup the local `.env` file.

### Steps to running the graph-jira locally

1. Install [Node.js](https://nodejs.org/) using the
   [installer](https://nodejs.org/en/download/) or a version manager such as
   [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).
   Be sure to use Node version 14.x.
2. Install [`yarn`](https://yarnpkg.com/getting-started/install) or
   [`npm`](https://github.com/npm/cli#installation) to install dependencies.
3. Install dependencies with `yarn install`.
4. Register an account in the system this integration targets for ingestion and
   obtain API credentials.
5. `cp .env.example .env` and add necessary values for runtime configuration.

   When an integration executes, it needs API credentials and any other
   configuration parameters necessary for fetching data from the provider. The
   names of these parameters are defined in `src/instanceConfigFields.ts`. When
   executed in a development environment, values for these parameters are read
   from Node's `process.env`, loaded from `.env`. That file has been added to
   `.gitignore` to avoid commiting credentials.

6. Edit the local `.env` file and update the following fields:
   - JIRA_HOST: the value containing the host URL from prerequisites.
   - JIRA_API_VERSION: use the value of `3`, unless Jira is running locally,
     then default to `2`.
   - JIRA_USERNAME: the email id used to access tha Atlassian Jira system from
     prerequisites.
   - JIRA_PASSWORD: the API token value from cloud prerequisites. Or the user
     password for local Jira.
   - PROJECTS: can be left as `[""]` or specify a key name from prerequisites.
   - REDACT_ISSUE_DESCRIPTIONS: can remain FALSE, unless data in the Jira
     descriptions is highly sensitive or other company sensitivity rating which
     deems it not shareable.

### Running the integration

1. `yarn start` to run integrtion and collect data
2. `yarn graph` to show a visualization of the collected data
3. `yarn j1-integration -h` for additional commands

### Making Contributions

Start by taking a look at the source code. The integration is basically a set of
functions called steps, each of which ingests a collection of resources and
relationships. The goal is to limit each step to as few resource types as
possible so that should the ingestion of one type of data fail, it does not
necessarily prevent the ingestion of other, unrelated data. That should be
enough information to allow you to get started coding!

See the
[SDK development documentation](https://github.com/JupiterOne/sdk/blob/main/docs/integrations/development.md)
for a deep dive into the mechanics of how integrations work.

See [docs/development.md](docs/development.md) for any additional details about
developing this integration.

### Changelog

The history of this integration's development can be viewed at
[CHANGELOG.md](CHANGELOG.md).

[def]:
  https://community.askj1.com/kb/articles/1009-jira-integration-with-jupiterone
