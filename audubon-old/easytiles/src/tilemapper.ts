export interface ITile {
  level: number;
  row: number;
  col: number;
  world: number;
}

export class ProxyTile {
  needed = true;
  loadAbortController: AbortController | null = null;
  loaded = false;
  destroyed = false;

  constructor(public tile: ITile) {
  }
}

export function id(tile: ITile | { key: ITile } | string): string {
  if (typeof tile === "string") {
    return tile;
  } else if ("key" in tile) {
    const { key } = tile;
    return `${key.level}/${key.row}/${key.col}/${key.world}`;
  } else {
    return `${tile.level}/${tile.row}/${tile.col}/${tile.world}`;
  }
}

export class TileMapper {
  private _tileMap = new Map<string, ProxyTile>();
  private _tiles: ITile[] = [];

  constructor(private _load: (tile: ITile, abortSignal: AbortSignal) => Promise<void>, private _destroy: (tile: ITile) => void) {}

  get tiles(): ITile[] {
    return this._tiles;
  }

  set tiles(value: ITile[]) {
    const newTiles = new Map<string, ITile>();

    for (const tile of value) {
      newTiles.set(id(tile), tile);
    }

    this._diffTiles(newTiles);
    this._manageTiles();

    this._tiles = value;
  }

  private _diffTiles(newTiles: Map<string, ITile>): void {
    newTiles.forEach((newTile, newId) => {
      let proxyTile = this._tileMap.get(newId);

      if (!proxyTile) {
        proxyTile = new ProxyTile(newTile);
        const loadAbortController = new AbortController();
        this._load(newTile, loadAbortController.signal).then(() => {
          if (proxyTile) {
            proxyTile.loaded = true;
          }
        });
        proxyTile.loadAbortController = loadAbortController;
        this._tileMap.set(newId, proxyTile);
      }

      proxyTile.needed = true;
    });

    this._tileMap.forEach((proxyTile, id) => {
      if (!newTiles.has(id)) {
        proxyTile.needed = false;
      }
    });
  }

  private _manageTiles(): void {
    this._tileMap.forEach((proxyTile, id) => {
      if (!proxyTile.needed) {
        if (!proxyTile.loaded) {
          proxyTile.loadAbortController?.abort();
        }
        this._destroy(proxyTile.tile);
        this._tileMap.delete(id);
      }
    });
  }
}