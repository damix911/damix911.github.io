define(["require", "exports", "./core"], function (require, exports, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DrawSprites = exports.SpriteBatch = void 0;
    class SpriteBatch extends core_1.ResourceNode {
        constructor(parent, maxSprites) {
            super(parent);
            this._instances = [];
            this._indexCount = 0;
            this._vertexData = new Float32Array(maxSprites * 4 * 8);
            this._indexData = new Uint16Array(maxSprites * 6);
        }
        get instances() {
            return this._instances;
        }
        set instances(value) {
            this._instances = value;
            let c = 0;
            let d = 0;
            for (let i = 0; i < value.length; i++) {
                const x = value[i].x;
                const y = value[i].y;
                const size = value[i].size;
                const rotation = value[i].rotation;
                const co = Math.cos(Math.PI * rotation / 180);
                const si = Math.sin(Math.PI * rotation / 180);
                const colorAsFloat = new Float32Array(new Uint8Array(value[i].color.map(c => Math.floor(c * 255))).buffer)[0];
                this._vertexData[c++] = x;
                this._vertexData[c++] = y;
                this._vertexData[c++] = co * (-0.5 * size) - si * (-0.5 * size);
                this._vertexData[c++] = si * (-0.5 * size) + co * (-0.5 * size);
                this._vertexData[c++] = 0;
                this._vertexData[c++] = 0;
                this._vertexData[c++] = colorAsFloat;
                this._vertexData[c++] = value[i].id;
                this._vertexData[c++] = x;
                this._vertexData[c++] = y;
                this._vertexData[c++] = co * (0.5 * size) - si * (-0.5 * size);
                this._vertexData[c++] = si * (0.5 * size) + co * (-0.5 * size);
                this._vertexData[c++] = 1;
                this._vertexData[c++] = 0;
                this._vertexData[c++] = colorAsFloat;
                this._vertexData[c++] = value[i].id;
                this._vertexData[c++] = x;
                this._vertexData[c++] = y;
                this._vertexData[c++] = co * (-0.5 * size) - si * (0.5 * size);
                this._vertexData[c++] = si * (-0.5 * size) + co * (0.5 * size);
                this._vertexData[c++] = 0;
                this._vertexData[c++] = 1;
                this._vertexData[c++] = colorAsFloat;
                this._vertexData[c++] = value[i].id;
                this._vertexData[c++] = x;
                this._vertexData[c++] = y;
                this._vertexData[c++] = co * (0.5 * size) - si * (0.5 * size);
                this._vertexData[c++] = si * (0.5 * size) + co * (0.5 * size);
                this._vertexData[c++] = 1;
                this._vertexData[c++] = 1;
                this._vertexData[c++] = colorAsFloat;
                this._vertexData[c++] = value[i].id;
                this._indexData[d++] = i * 4 + 0;
                this._indexData[d++] = i * 4 + 1;
                this._indexData[d++] = i * 4 + 2;
                this._indexData[d++] = i * 4 + 1;
                this._indexData[d++] = i * 4 + 3;
                this._indexData[d++] = i * 4 + 2;
            }
            this._setInvalidated();
        }
        load(state) {
            const { gl } = state;
            const vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                throw new Error("Could not create vertex buffer.");
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._vertexData.byteLength, gl.STREAM_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this._vertexBuffer = vertexBuffer;
            const indexBuffer = gl.createBuffer();
            if (!indexBuffer) {
                throw new Error("Could not create index buffer.");
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexData.byteLength, gl.STREAM_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexBuffer = indexBuffer;
            return true;
        }
        update(state) {
            const { gl } = state;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertexData);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this._indexData);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexCount = this._instances.length * 6;
            return true;
        }
        destroy(state) {
            const { gl } = state;
            gl.deleteBuffer(this._vertexBuffer);
            gl.deleteBuffer(this._indexBuffer);
            return true;
        }
        draw(gl) {
            if (!this._vertexBuffer || !this._indexBuffer) {
                throw new Error("Vertex data was not created.");
            }
            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.enableVertexAttribArray(2);
            gl.enableVertexAttribArray(3);
            gl.enableVertexAttribArray(4);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 16);
            gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 32, 24);
            gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 32, 28);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
            gl.disableVertexAttribArray(0);
            gl.disableVertexAttribArray(1);
            gl.disableVertexAttribArray(2);
            gl.disableVertexAttribArray(3);
            gl.disableVertexAttribArray(4);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }
    exports.SpriteBatch = SpriteBatch;
    class DrawSprites extends core_1.SimpleNode {
        constructor(parent, _program, _texture, _batch) {
            super(parent);
            this._program = _program;
            this._texture = _texture;
            this._batch = _batch;
            this._transform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            this.time = 0;
        }
        process(state) {
            if (!this._program.ready || !this._texture.ready || !this._batch.ready) {
                return false;
            }
            const { gl } = state;
            this._program.bind(gl);
            this._texture.bind(gl);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.uniform1i(this._program.uniforms["u_texture"], 0);
            gl.uniformMatrix4fv(this._program.uniforms["u_transform"], false, this._transform);
            gl.uniform1f(this._program.uniforms["u_time"], this.time);
            this._batch.draw(gl);
            this._texture.unbind(gl);
            this._program.unbind(gl);
            gl.disable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ZERO);
            return true;
        }
        get transform() {
            return this._transform;
        }
    }
    exports.DrawSprites = DrawSprites;
});
