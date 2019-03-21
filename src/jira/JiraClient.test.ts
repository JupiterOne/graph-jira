import "jest-extended";
import nock from "nock";
import JiraClient from "./JiraClient";

describe("JiraClient fetch ok data", () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../../test/fixtures/`;
    nock.back.setMode("record");
  });

  async function getAuthenticatedClient() {
    const client = new JiraClient({
      host: "dualboot-test.atlassian.net",
      username: "admin@test.dualboot.com",
      password: "ckMqQhfGZXd9d3",
    });

    await client.authenticate();
    return client;
  }

  test("fetch server info ok", async () => {
    const { nockDone } = await nock.back("server-info-ok.json");
    const client = await getAuthenticatedClient();
    const response = await client.fetchServerInfo();
    expect(response).toContainKeys(["baseUrl", "serverTitle"]);
    nockDone();
  });

  test("fetch projects ok", async () => {
    const { nockDone } = await nock.back("projects-ok.json");
    const client = await getAuthenticatedClient();
    const response = await client.fetchProjects();
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
    expect(response.map(value => value.name)).toEqual([
      "First Project",
      "Second project",
    ]);
    nockDone();
  });

  test("fetch users ok", async () => {
    const { nockDone } = await nock.back("users-ok.json");
    const client = await getAuthenticatedClient();
    const response = await client.fetchUsers();
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
    nockDone();
  });

  test("fetch issues with existing project ok", async () => {
    const { nockDone } = await nock.back("issues-ok.json");
    const client = await getAuthenticatedClient();
    const response = await client.fetchIssues("First Project");
    expect(response).toBeArray();
    expect(response).not.toBeArrayOfSize(0);
    nockDone();
  });

  test("fetch issues with not existing project ok", async () => {
    const { nockDone } = await nock.back("issues-not-existed-exception.json");
    const client = await getAuthenticatedClient();
    await expect(client.fetchIssues("NotExistedProject")).rejects.toThrow();
    nockDone();
  });

  test("fetch issues with empty param project ok", async () => {
    const { nockDone } = await nock.back("issues-empty-param.json");
    const client = await getAuthenticatedClient();
    const issues = await client.fetchIssues("");
    expect(issues).toEqual([]);
    nockDone();
  });

  afterAll(() => {
    nock.restore();
  });
});

describe("JiraClient bad credentials", () => {
  beforeAll(() => {
    nock.back.fixtures = `${__dirname}/../../test/fixtures/`;
    nock.back.setMode("record");
  });

  async function getAuthenticatedClient() {
    const client = new JiraClient({
      host: "dualboot-test.atlassian.net",
      username: "fakeUser",
      password: "fakePassword",
    });

    await client.authenticate();
    return client;
  }

  test("fetch server info with bad auth", async () => {
    const { nockDone } = await nock.back("server-info-bad.json");

    const client = await getAuthenticatedClient();
    await expect(client.fetchServerInfo()).rejects.toThrow();

    nockDone();
  });

  afterAll(() => {
    nock.restore();
  });
});
