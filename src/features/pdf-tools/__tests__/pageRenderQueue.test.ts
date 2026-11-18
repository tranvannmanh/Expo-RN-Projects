import { PageRenderQueue } from '../services/pageRenderQueue';

/** A render whose completion the test controls. */
function deferred() {
  let resolve!: (uri: string) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('PageRenderQueue', () => {
  it('runs one job at a time, most urgent first', async () => {
    const queue = new PageRenderQueue();
    const order: string[] = [];
    const jobs = { a: deferred(), b: deferred(), c: deferred() };
    const run = (key: keyof typeof jobs) => () => {
      order.push(key);
      return jobs[key].promise;
    };

    queue.request('a', 2, run('a'), jest.fn()); // starts immediately (queue idle)
    queue.request('b', 2, run('b'), jest.fn());
    queue.request('c', 0, run('c'), jest.fn()); // more urgent than b
    expect(order).toEqual(['a']);

    jobs.a.resolve('a.jpg');
    await flush();
    expect(order).toEqual(['a', 'c']);

    jobs.c.resolve('c.jpg');
    await flush();
    expect(order).toEqual(['a', 'c', 'b']);
  });

  it('drops a waiting job when its last subscriber leaves (page scrolled away)', async () => {
    const queue = new PageRenderQueue();
    const first = deferred();
    const skipped = jest.fn(() => Promise.resolve('x.jpg'));

    queue.request('running', 0, () => first.promise, jest.fn());
    const unsubscribe = queue.request('far-away', 1, skipped, jest.fn());
    expect(queue.pending).toBe(1);

    unsubscribe();
    expect(queue.pending).toBe(0);

    first.resolve('done.jpg');
    await flush();
    expect(skipped).not.toHaveBeenCalled();
  });

  it('shares one render between subscribers of the same page and keeps the urgent priority', async () => {
    const queue = new PageRenderQueue();
    const blocker = deferred();
    const render = jest.fn(() => Promise.resolve('page.jpg'));
    const one = jest.fn();
    const two = jest.fn();

    queue.request('blocker', 0, () => blocker.promise, jest.fn());
    queue.request('page', 5, render, one);
    queue.request('page', 1, render, two);
    blocker.resolve('b.jpg');
    await flush();
    await flush();

    expect(render).toHaveBeenCalledTimes(1);
    expect(one).toHaveBeenCalledWith({ uri: 'page.jpg' });
    expect(two).toHaveBeenCalledWith({ uri: 'page.jpg' });
  });

  it('reports failures and keeps processing the queue', async () => {
    const queue = new PageRenderQueue();
    const failing = deferred();
    const onFail = jest.fn();
    const next = jest.fn(() => Promise.resolve('ok.jpg'));
    const onNext = jest.fn();

    queue.request('broken', 0, () => failing.promise, onFail);
    queue.request('next', 1, next, onNext);
    failing.reject(new Error('render failed'));
    await flush();
    await flush();

    expect(onFail).toHaveBeenCalledWith({ error: expect.any(Error) });
    expect(onNext).toHaveBeenCalledWith({ uri: 'ok.jpg' });
  });
});
