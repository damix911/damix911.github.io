define(["require", "exports", "./core"], function (require, exports, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Draw = exports.SetUniforms = exports.setUniform = exports.SetTextures = exports.SetMesh = exports.SetProgram = exports.Mesh = exports.getGLSize = exports.Program = exports.Texture2D = exports.Clear = exports.RenderingContext = void 0;
    class RenderingContext extends core_1.ContainerNode {
        constructor(parent, gl) {
            super(parent);
            if (!gl) {
                const canvas = document.createElement("canvas");
                canvas.width = 640;
                canvas.height = 360;
                canvas.style.border = "1px solid black";
                const createdGl = canvas.getContext("webgl");
                if (!createdGl) {
                    throw new Error("Cannot create WebGL context.");
                }
                gl = createdGl;
                document.body.appendChild(canvas);
            }
            this._glState = {
                gl,
                clearColor: [0, 0, 0, 0],
                clearDepth: 1,
                program: null,
                mesh: null,
                textures: {},
                uniforms: {}
            };
        }
        process(state) {
            state = this._glState;
            return this.processChildren(state);
        }
        get width() {
            return this._glState.gl.canvas.width;
        }
        get height() {
            return this._glState.gl.canvas.height;
        }
    }
    exports.RenderingContext = RenderingContext;
    class Clear extends core_1.ContainerNode {
        constructor(parent, clearColor, clearDepth) {
            super(parent);
            this._clearColor = clearColor;
            this._clearDepth = clearDepth;
        }
        process(state) {
            const { gl, clearColor, clearDepth } = state;
            state.clearColor = this._clearColor;
            state.clearDepth = this._clearDepth;
            gl.clearColor(state.clearColor[0], state.clearColor[1], state.clearColor[2], state.clearColor[3]);
            gl.clearDepth(state.clearDepth);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const allChildrenProcessed = this.processChildren(state);
            state.clearColor = clearColor;
            state.clearDepth = clearDepth;
            gl.clearColor(state.clearColor[0], state.clearColor[1], state.clearColor[2], state.clearColor[3]);
            gl.clearDepth(state.clearDepth);
            return allChildrenProcessed;
        }
    }
    exports.Clear = Clear;
    class Texture2D extends core_1.ResourceNode {
        constructor(parent, src, _updater) {
            super(parent);
            this._updater = _updater;
            this._image = new Image();
            this._image.crossOrigin = "anonymous";
            this._image.src = src;
            this._texture = null;
        }
        load(state) {
            const { gl } = state;
            if (!this._image || !this._image.complete) {
                return false;
            }
            const texture = gl.createTexture();
            if (!texture) {
                throw new Error("Cannot create texture.");
            }
            const prevTexture = state.textures[7] || null;
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, prevTexture);
            this._image = null;
            this._texture = texture;
            return true;
        }
        destroy(state) {
            const { gl } = state;
            gl.deleteTexture(this._texture);
            this._texture = null;
            this._setDestroyed();
            return true;
        }
        bind(gl, unit = 0) {
            if (!this._texture) {
                throw new Error("Texture was not created.");
            }
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
        }
        unbind(gl, unit = 0) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        update(state) {
            if (!this._updater) {
                return true;
            }
            const canvas = this._updater();
            if (!canvas) {
                // Think about this
                return true;
            }
            const { gl } = state;
            const prevTexture = state.textures[7] || null;
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, prevTexture);
            return true;
        }
        upload() {
            this._setInvalidated();
        }
    }
    exports.Texture2D = Texture2D;
    class Program extends core_1.ResourceNode {
        constructor(parent, _vsSrc, _fsSrc, _attributes, _uniformDeclarations) {
            super(parent);
            this._vsSrc = _vsSrc;
            this._fsSrc = _fsSrc;
            this._attributes = _attributes;
            this._uniformDeclarations = _uniformDeclarations;
            this._program = null;
            this._uniforms = null;
            this._uniformTypes = null;
        }
        load(state) {
            const { gl } = state;
            const vs = gl.createShader(gl.VERTEX_SHADER);
            if (!vs) {
                throw new Error("Cannot create vertex shader.");
            }
            gl.shaderSource(vs, this._vsSrc);
            gl.compileShader(vs);
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
                throw new Error(`Vertex shader compilation failed: ${gl.getShaderInfoLog(vs) || ""}`);
            }
            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            if (!fs) {
                throw new Error("Cannot create fragment shader.");
            }
            gl.shaderSource(fs, this._fsSrc);
            gl.compileShader(fs);
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
                throw new Error(`Fragment shader compilation failed: ${gl.getShaderInfoLog(fs) || ""}`);
            }
            const program = gl.createProgram();
            if (!program) {
                throw new Error("Cannot create program.");
            }
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            for (const name in this._attributes) {
                gl.bindAttribLocation(program, this._attributes[name], name);
            }
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(`Program linking failed: ${gl.getProgramInfoLog(program) || ""}`);
            }
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            this._program = program;
            const uniforms = {};
            const uniformTypes = {};
            for (const { name, type } of this._uniformDeclarations) {
                const uniformLocation = gl.getUniformLocation(program, name);
                if (!uniformLocation) {
                    throw new Error(`Cannot retrieve uniform location "${name}".`);
                }
                uniforms[name] = uniformLocation;
                uniformTypes[name] = type;
            }
            this._uniforms = uniforms;
            this._uniformTypes = uniformTypes;
            return true;
        }
        destroy(state) {
            const { gl } = state;
            if (this._program) {
                gl.deleteProgram(this._program);
                this._program = null;
            }
            return true;
        }
        bind(gl) {
            if (!this._program) {
                throw new Error("Program was not created.");
            }
            gl.useProgram(this._program);
        }
        unbind(gl) {
            gl.useProgram(null);
        }
        get attributes() {
            return this._attributes;
        }
        get uniforms() {
            if (!this._uniforms) {
                throw new Error("Uniforms were not retrieved.");
            }
            return this._uniforms;
        }
        get uniformTypes() {
            if (!this._uniformTypes) {
                throw new Error("Uniforms were not retrieved.");
            }
            return this._uniformTypes;
        }
    }
    exports.Program = Program;
    function getGLSize(type) {
        return {
            5120: 1,
            5122: 1,
            5121: 2,
            5123: 2,
            5126: 4
        }[type];
    }
    exports.getGLSize = getGLSize;
    class Mesh extends core_1.ResourceNode {
        constructor(parent, _vertexAttribPointers, maxVertices, maxIndices, _drawUsage) {
            super(parent);
            this._vertexAttribPointers = _vertexAttribPointers;
            this._drawUsage = _drawUsage;
            this._vertexSize = 0;
            this.indexCount = 0;
            this._vertexSize = 0;
            for (const vap of this._vertexAttribPointers) {
                this._vertexSize += getGLSize(vap.type) * vap.size;
            }
            this._vertexData = new ArrayBuffer(this._vertexSize * maxVertices);
            this._indexData = new Uint16Array(maxIndices);
        }
        get vertexData() {
            return new DataView(this._vertexData);
        }
        get indexData() {
            return this._indexData;
        }
        load(state) {
            const { gl } = state;
            const vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                throw new Error("Could not create vertex buffer.");
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._vertexData.byteLength, this._drawUsage);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this._vertexBuffer = vertexBuffer;
            const indexBuffer = gl.createBuffer();
            if (!indexBuffer) {
                throw new Error("Could not create index buffer.");
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexData.byteLength, this._drawUsage);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexBuffer = indexBuffer;
            return true;
        }
        upload() {
            this._setInvalidated();
        }
        update(state) {
            const { gl } = state;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertexData);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this._indexData);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return true;
        }
        destroy(state) {
            const { gl } = state;
            gl.deleteBuffer(this._vertexBuffer);
            gl.deleteBuffer(this._indexBuffer);
            return true;
        }
        bind(gl) {
            if (!this._vertexBuffer || !this._indexBuffer) {
                throw new Error("Vertex data was not created.");
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            let offset = 0;
            for (let i = 0; i < this._vertexAttribPointers.length; i++) {
                const { size, type, normalized } = this._vertexAttribPointers[i];
                gl.vertexAttribPointer(i, size, type, normalized, this._vertexSize, offset);
                gl.enableVertexAttribArray(i);
                offset += getGLSize(type) * size;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        }
        draw(gl) {
            gl.enable(gl.BLEND); // Do I need this?
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Do I need this?
            gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
            gl.disable(gl.BLEND); // Do I need this?
            gl.blendFunc(gl.ONE, gl.ZERO); // Do I need this?
        }
        unbind(gl) {
            for (let i = 0; i < this._vertexAttribPointers.length; i++) {
                gl.disableVertexAttribArray(i);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }
    exports.Mesh = Mesh;
    class SetProgram extends core_1.ContainerNode {
        constructor(parent, _program) {
            super(parent);
            this._program = _program;
        }
        process(state) {
            if (!this._program.ready) {
                return false;
            }
            const { gl, program } = state;
            this._program.bind(gl);
            state.program = this._program;
            const allChildrenProcessed = this.processChildren(state);
            state.program = program;
            this._program.unbind(gl);
            return allChildrenProcessed;
        }
    }
    exports.SetProgram = SetProgram;
    class SetMesh extends core_1.ContainerNode {
        constructor(parent, _mesh) {
            super(parent);
            this._mesh = _mesh;
        }
        process(state) {
            if (!this._mesh.ready) {
                return false;
            }
            const { gl, mesh } = state;
            this._mesh.bind(gl);
            state.mesh = this._mesh;
            const allChildrenProcessed = this.processChildren(state);
            state.mesh = mesh;
            this._mesh.unbind(gl);
            return allChildrenProcessed;
        }
    }
    exports.SetMesh = SetMesh;
    class SetTextures extends core_1.ContainerNode {
        constructor(parent, _bindings) {
            super(parent);
            this._bindings = _bindings;
        }
        process(state) {
            const { gl, textures } = state;
            let allChildrenProcessed = true;
            let allTexturesReady = true;
            state.textures = this._bindings;
            for (const unit in state.textures) {
                gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
                const tex = state.textures[parseInt(unit, 10)];
                allTexturesReady = allTexturesReady && tex.ready;
                tex.ready && tex.bind(gl, parseInt(unit, 10));
            }
            if (allTexturesReady) {
                allChildrenProcessed = this.processChildren(state);
            }
            state.textures = textures;
            for (const unit in state.textures) {
                gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
                const tex = state.textures[parseInt(unit, 10)];
                tex.ready && tex.bind(gl, parseInt(unit, 10));
            }
            return allChildrenProcessed && allTexturesReady;
        }
    }
    exports.SetTextures = SetTextures;
    function setUniform(gl, location, type, value) {
        switch (type) {
            case "int":
                {
                    gl.uniform1i(location, value);
                    break;
                }
            case "sampler2D":
                {
                    gl.uniform1i(location, value);
                    break;
                }
            case "float":
                {
                    gl.uniform1f(location, value);
                    break;
                }
            case "vec2":
                {
                    gl.uniform2fv(location, value);
                    break;
                }
            case "vec3":
                {
                    gl.uniform3fv(location, value);
                    break;
                }
            case "vec4":
                {
                    gl.uniform4fv(location, value);
                    break;
                }
            case "mat2":
                {
                    gl.uniformMatrix2fv(location, false, value);
                    break;
                }
            case "mat3":
                {
                    gl.uniformMatrix3fv(location, false, value);
                    break;
                }
            case "mat4":
                {
                    gl.uniformMatrix4fv(location, false, value);
                    break;
                }
        }
    }
    exports.setUniform = setUniform;
    class SetUniforms extends core_1.ContainerNode {
        constructor(parent) {
            super(parent);
            this.values = {};
        }
        process(state) {
            var _a, _b, _c, _d;
            const { gl, uniforms } = state;
            state.uniforms = this.values;
            for (const name in state.uniforms) {
                const value = state.uniforms[name];
                const location = (_a = state.program) === null || _a === void 0 ? void 0 : _a.uniforms[name];
                const type = (_b = state.program) === null || _b === void 0 ? void 0 : _b.uniformTypes[name];
                setUniform(gl, location, type, value);
            }
            const allChildrenProcessed = this.processChildren(state);
            state.uniforms = uniforms;
            for (const name in state.uniforms) {
                const value = state.uniforms[name];
                const location = (_c = state.program) === null || _c === void 0 ? void 0 : _c.uniforms[name];
                const type = (_d = state.program) === null || _d === void 0 ? void 0 : _d.uniformTypes[name];
                setUniform(gl, location, type, value);
            }
            return allChildrenProcessed;
        }
    }
    exports.SetUniforms = SetUniforms;
    class Draw extends core_1.SimpleNode {
        constructor(parent) {
            super(parent);
            this.visible = true;
        }
        process(state) {
            const { gl } = state;
            if (!this.visible) {
                return true;
            }
            if (!state.mesh) {
                return false;
            }
            state.mesh.draw(gl);
            return true;
        }
    }
    exports.Draw = Draw;
});
