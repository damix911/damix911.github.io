define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TileMapper = exports.id = exports.ProxyTile = void 0;
    class ProxyTile {
        constructor(tile) {
            this.tile = tile;
            this.needed = true;
            this.loadAbortController = null;
            this.loaded = false;
            this.destroyed = false;
        }
    }
    exports.ProxyTile = ProxyTile;
    function id(tile) {
        if (typeof tile === "string") {
            return tile;
        }
        else if ("key" in tile) {
            const { key } = tile;
            return `${key.level}/${key.row}/${key.col}/${key.world}`;
        }
        else {
            return `${tile.level}/${tile.row}/${tile.col}/${tile.world}`;
        }
    }
    exports.id = id;
    class TileMapper {
        constructor(_load, _destroy) {
            this._load = _load;
            this._destroy = _destroy;
            this._tileMap = new Map();
            this._tiles = [];
        }
        get tiles() {
            return this._tiles;
        }
        set tiles(value) {
            const newTiles = new Map();
            for (const tile of value) {
                newTiles.set(id(tile), tile);
            }
            this._diffTiles(newTiles);
            this._manageTiles();
            this._tiles = value;
        }
        _diffTiles(newTiles) {
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
        _manageTiles() {
            this._tileMap.forEach((proxyTile, id) => {
                var _a;
                if (!proxyTile.needed) {
                    if (!proxyTile.loaded) {
                        (_a = proxyTile.loadAbortController) === null || _a === void 0 ? void 0 : _a.abort();
                    }
                    this._destroy(proxyTile.tile);
                    this._tileMap.delete(id);
                }
            });
        }
    }
    exports.TileMapper = TileMapper;
});
