import Semaphore from "../src/index";

const pause = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("Acquire & Release Basic", async () => {
  const semaphore = new Semaphore();
  expect(semaphore.canAcquire()).toBe(true);
  await semaphore.acquire();
  expect(semaphore.canAcquire()).toBe(false);
  expect(semaphore.hasTasks()).toBe(true);
  expect(semaphore.count()).toBe(1);
  semaphore.release();
  expect(semaphore.canAcquire()).toBe(true);
  expect(semaphore.count()).toBe(0);
});

test("Semaphore 1", async () => {
  const semaphore = new Semaphore();

  semaphore
    .acquire()
    .then(async () => await pause(1000))
    .finally(() => semaphore.release());

  expect(semaphore.canAcquire()).toBe(false);

  await pause(600);

  expect(semaphore.canAcquire()).toBe(false);

  await pause(600);

  expect(semaphore.canAcquire()).toBe(true);
});

test("Semaphore 2", async () => {
  const semaphore = new Semaphore();

  let tester = 0;

  semaphore
    .acquire()
    .then(() => pause(1000))
    .then(() => (tester = 10))
    .finally(() => semaphore.release());

  // tests acquire waits for previous to complete
  await semaphore
    .acquire()
    .then(() => expect(tester).toBe(10))
    .finally(() => semaphore.release());
});

test("Semaphore 3", async () => {
  const semaphore = new Semaphore(2);

  let tester = 0;

  semaphore
    .acquire()
    .then(() => pause(1000))
    .then(() => (tester = 20))
    .finally(() => semaphore.release());

  semaphore
    .acquire()
    .then(() => pause(500))
    .then(() => (tester = 10))
    .finally(() => semaphore.release());

  expect(semaphore.count()).toBe(2);
  expect(semaphore.hasTasks()).toBe(true);

  // expect 10 since this next block will run before the first has completed
  await semaphore
    .acquire()
    .then(() => expect(tester).toBe(10))
    .finally(() => semaphore.release());

  expect(semaphore.count()).toBe(1);
  expect(semaphore.hasTasks()).toBe(true);
  expect(semaphore.canAcquire()).toBe(true);
});

test("Request 1", async () => {
  const semaphore = new Semaphore();

  let tester = 0;

  semaphore.request(async () => {
    await pause(1000);
    tester = 20;
  });

  semaphore.request(async () => {
    await pause(500);
    tester = 10;
  });

  await semaphore.request(async () => {
    expect(tester).toBe(10);
  });
});

test("Request 2", async () => {
  const semaphore = new Semaphore(2);

  let tester = 0;

  semaphore.request(async () => {
    await pause(1000);
    tester = 20;
  });

  semaphore.request(async () => {
    await pause(500);
    tester = 10;
  });

  await semaphore.request(async () => {
    expect(tester).toBe(10);
  });
});

test("Request 3", async () => {
  const semaphore = new Semaphore(3);

  let tester = 0;

  semaphore.request(async () => {
    await pause(1000);
    tester = 20;
  });

  semaphore.request(async () => {
    await pause(500);
    tester = 10;
  });

  await semaphore.request(async () => {
    expect(tester).toBe(0);
  });
});
