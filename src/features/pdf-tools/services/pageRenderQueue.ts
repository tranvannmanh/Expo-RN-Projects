type Listener = (result: { uri: string } | { error: unknown }) => void;

type Job = {
  key: string;
  priority: number;
  run: () => Promise<string>;
  listeners: Set<Listener>;
};

/**
 * Serial, prioritised render queue for viewer pages.
 *
 * - Only one job runs at a time (the native renderer is serial anyway), so everything still
 *   waiting can be cancelled: when the last subscriber of a job leaves (its page scrolled out of
 *   the list window), the job is dropped before it ever reaches native.
 * - Lower `priority` runs first; requests for the same key share one job and keep the most
 *   urgent priority.
 */
export class PageRenderQueue {
  private readonly jobs = new Map<string, Job>();
  private running: Job | null = null;

  /** Subscribes to a render; returns an unsubscribe function (cancels if nobody else waits). */
  request(
    key: string,
    priority: number,
    run: () => Promise<string>,
    listener: Listener,
  ): () => void {
    const existing = this.running?.key === key ? this.running : this.jobs.get(key);
    const job = existing ?? { key, priority, run, listeners: new Set<Listener>() };
    job.priority = Math.min(job.priority, priority);
    job.listeners.add(listener);
    if (!existing) this.jobs.set(key, job);
    this.pump();

    return () => {
      job.listeners.delete(listener);
      if (job.listeners.size === 0 && this.running !== job) this.jobs.delete(key);
    };
  }

  /** Number of jobs waiting (not counting the one running). Exposed for tests/diagnostics. */
  get pending(): number {
    return this.jobs.size;
  }

  private pump() {
    if (this.running || this.jobs.size === 0) return;
    let next: Job | null = null;
    for (const job of this.jobs.values()) if (!next || job.priority < next.priority) next = job;
    if (!next) return;

    const job = next;
    this.jobs.delete(job.key);
    this.running = job;
    job
      .run()
      .then(
        (uri) => job.listeners.forEach((listener) => listener({ uri })),
        (error: unknown) => job.listeners.forEach((listener) => listener({ error })),
      )
      .finally(() => {
        this.running = null;
        this.pump();
      });
  }
}

/** One queue for the whole app: only one viewer is open at a time. */
export const pageRenderQueue = new PageRenderQueue();
