/**
 * In-memory replacement for the expo-file-system `File` / `Directory` / `Paths` API surface
 * the app uses. Test helpers live on `memoryFs`.
 */
const ROOT = 'file:///data/user/0/app/files/';
const CACHE = 'file:///data/user/0/app/cache/';

const files = new Map<string, string>();
const dirs = new Set<string>();

type UriPart = string | File | Directory;

function join(parts: UriPart[]): string {
  return parts
    .map((part, index) => {
      const value = typeof part === 'string' ? part : part.uri;
      return index === 0 ? value.replace(/\/+$/, '') : value.replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

const nameOf = (uri: string) => uri.replace(/\/+$/, '').split('/').pop() ?? '';

export class File {
  readonly uri: string;
  constructor(...parts: UriPart[]) {
    this.uri = join(parts);
  }
  get name() {
    return nameOf(this.uri);
  }
  get exists() {
    return files.has(this.uri);
  }
  delete() {
    if (!files.delete(this.uri)) throw new Error(`ENOENT: ${this.uri}`);
  }
  async copy(destination: File) {
    const content = files.get(this.uri);
    if (content === undefined) throw new Error(`ENOENT: ${this.uri}`);
    files.set(destination.uri, content);
  }
}

export class Directory {
  readonly uri: string;
  constructor(...parts: UriPart[]) {
    this.uri = join(parts);
  }
  get name() {
    return nameOf(this.uri);
  }
  get exists() {
    const prefix = `${this.uri}/`;
    return dirs.has(this.uri) || [...files.keys(), ...dirs].some((p) => p.startsWith(prefix));
  }
  create() {
    dirs.add(this.uri);
  }
  delete() {
    const prefix = `${this.uri}/`;
    if (!this.exists) throw new Error(`ENOENT: ${this.uri}`);
    for (const key of [...files.keys()]) if (key.startsWith(prefix)) files.delete(key);
    for (const key of [...dirs]) if (key === this.uri || key.startsWith(prefix)) dirs.delete(key);
  }
  list(): (File | Directory)[] {
    const prefix = `${this.uri}/`;
    const children = new Map<string, File | Directory>();
    for (const path of [...files.keys(), ...dirs]) {
      if (!path.startsWith(prefix)) continue;
      const [head, ...rest] = path.slice(prefix.length).split('/');
      const isDir = rest.length > 0 || dirs.has(path);
      children.set(head, isDir ? new Directory(this, head) : new File(this, head));
    }
    return [...children.values()];
  }
}

export const Paths = {
  get document() {
    return new Directory(ROOT);
  },
  get cache() {
    return new Directory(CACHE);
  },
};

export const memoryFs = {
  root: ROOT,
  /** Writes a file at a path relative to the document dir. */
  write(relativePath: string, content = 'data') {
    files.set(new File(Paths.document, relativePath).uri, content);
  },
  /** Writes a file at a path relative to the cache dir. */
  writeCache(relativePath: string, content = 'data') {
    files.set(new File(Paths.cache, relativePath).uri, content);
  },
  exists(relativePath: string) {
    return files.has(new File(Paths.document, relativePath).uri);
  },
  /** Relative paths of all files under the document dir. */
  list() {
    return [...files.keys()].filter((k) => k.startsWith(ROOT)).map((k) => k.slice(ROOT.length)).sort();
  },
  cacheFiles() {
    return [...files.keys()].filter((k) => k.startsWith(CACHE)).map((k) => k.slice(CACHE.length));
  },
  reset() {
    files.clear();
    dirs.clear();
  },
};
