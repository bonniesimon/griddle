export const fakeFileSystem = new Map<string, string>();

const directoriesCreated = new Set<string>();
let documentDirectoryUri = 'file:///documents';
let renderedThumbnailCounter = 0;

export const setDocumentDirectoryUri = (uri: string) => {
  documentDirectoryUri = uri;
};

export const createdDirectories = () => [...directoriesCreated];

export const resetFakeFileSystem = () => {
  fakeFileSystem.clear();
  directoriesCreated.clear();
  renderedThumbnailCounter = 0;
};

const withoutTrailingSlash = (uri: string) => (uri.endsWith('/') ? uri.slice(0, -1) : uri);

type PathLike = { uri: string } | string;

const uriOf = (pathLike: PathLike) => (typeof pathLike === 'string' ? pathLike : pathLike.uri);

const joinUris = (segments: PathLike[]) =>
  segments
    .map(uriOf)
    .map((segment, index) => (index === 0 ? withoutTrailingSlash(segment) : segment))
    .join('/');

class FakeDirectory {
  uri: string;

  constructor(...segments: PathLike[]) {
    this.uri = joinUris(segments);
  }

  get exists() {
    return directoriesCreated.has(this.uri);
  }

  create() {
    directoriesCreated.add(this.uri);
  }
}

class FakeFile {
  uri: string;

  constructor(...segments: PathLike[]) {
    this.uri = joinUris(segments);
  }

  get exists() {
    return fakeFileSystem.has(this.uri);
  }

  copySync(destination: FakeFile) {
    fakeFileSystem.set(destination.uri, fakeFileSystem.get(this.uri) ?? `bytes-of:${this.uri}`);
  }

  delete() {
    fakeFileSystem.delete(this.uri);
  }
}

export const expoFileSystemMock = {
  File: FakeFile,
  Directory: FakeDirectory,
  Paths: {
    get document() {
      return new FakeDirectory(documentDirectoryUri);
    },
  },
};

const fakeRenderedImage = {
  saveAsync: async () => {
    renderedThumbnailCounter += 1;
    return {
      uri: `file:///tmp/rendered/thumbnail-${renderedThumbnailCounter}.jpg`,
      width: 400,
      height: 300,
    };
  },
};

const fakeManipulationContext = {
  resize: () => fakeManipulationContext,
  renderAsync: async () => fakeRenderedImage,
};

export const imageManipulatorMock = {
  ImageManipulator: {
    manipulate: () => fakeManipulationContext,
  },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
};
