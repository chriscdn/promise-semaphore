import { describe, expect, it } from "vitest";

import { Semaphore } from "../lib";

const pause = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("All test", () => {
  it("Acquire & Release Basic", async () => {
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

  it("Semaphore 1", async () => {
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

  it("Semaphore 2", async () => {
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

  it("Semaphore 3", async () => {
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

  it("Request 1", async () => {
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

  it("Request 2", async () => {
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

  it("Request 3", async () => {
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
});

describe("Priority", () => {
  it("Priority", async () => {
    const semaphore = new Semaphore(1);
    let tester = 0;
    let key = "yyz";

    // this one is executed immediately since it's the first object
    const p1 = semaphore.request(async () => {
      tester = 5;
    }, { key, priority: 0 });

    // this one gets queued with priority 20
    const p2 = semaphore.request(async () => {
      tester = 10;
    }, { key, priority: 20 });

    // this one gets queued with priority 30, which should execute before p2
    const p3 = semaphore.request(async () => {
      expect(tester).toBe(5);
    }, { key, priority: 30 });

    await Promise.all([p1, p2, p3]);
  });
});
