define(["require", "exports", "./core"], function (require, exports, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DrawNode = exports.SetUniformsNode = exports.setUniform = exports.SetMeshNode = exports.SetProgramNode = exports.InterleavedMeshNode = exports.getGLSize = exports.ProgramNode = exports.ClearNode = exports.RenderingContextNode = void 0;
    class RenderingContextNode extends core_1.ContainerNode {
        constructor(parent, options) {
            super(parent);
            let gl;
            if (options && "gl" in options) {
                gl = options.gl;
            }
            else {
                let width = 640;
                let height = 360;
                if (options && "width" in options) {
                    width = options.width;
                    height = options.height;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
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
                textures: {}
            };
            this._glResources = new core_1.ResourceSet();
            this._canvas = gl.canvas;
        }
        process(state, resources) {
            state = this._glState;
            resources = this._glResources;
            return this.processChildren(state, resources);
        }
        get width() {
            return this._glState.gl.canvas.width;
        }
        get height() {
            return this._glState.gl.canvas.height;
        }
        get canvas() {
            return this._canvas;
        }
    }
    exports.RenderingContextNode = RenderingContextNode;
    class ClearNode extends core_1.ContainerNode {
        constructor(parent, clearColor, clearDepth) {
            super(parent);
            this._clearColor = clearColor;
            this._clearDepth = clearDepth;
        }
        process(state, resources) {
            const { gl, clearColor, clearDepth } = state;
            state.clearColor = this._clearColor;
            state.clearDepth = this._clearDepth;
            gl.clearColor(state.clearColor[0], state.clearColor[1], state.clearColor[2], state.clearColor[3]);
            gl.clearDepth(state.clearDepth);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const allChildrenProcessed = this.processChildren(state, resources);
            state.clearColor = clearColor;
            state.clearDepth = clearDepth;
            gl.clearColor(state.clearColor[0], state.clearColor[1], state.clearColor[2], state.clearColor[3]);
            gl.clearDepth(state.clearDepth);
            return allChildrenProcessed;
        }
    }
    exports.ClearNode = ClearNode;
    class ProgramNode extends core_1.SimpleResourceNode {
        constructor(parent, _vsSrc, _fsSrc, _attributes, _uniformDeclarations) {
            super(parent);
            this._vsSrc = _vsSrc;
            this._fsSrc = _fsSrc;
            this._attributes = _attributes;
            this._uniformDeclarations = _uniformDeclarations;
            this._program = null;
            this._uniformLocations = null;
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
            this._uniformLocations = uniforms;
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
        // bind(gl: WebGLRenderingContext): void {
        //   if (!this._program) {
        //     throw new Error("Program was not created.");
        //   }
        //   gl.useProgram(this._program);
        // }
        // unbind(gl: WebGLRenderingContext): void {
        //   gl.useProgram(null);
        // }
        // get attributes(): { [name: string]: number } {
        //   return this._attributes;
        // }
        // get uniformLocations(): { [name: string]: WebGLUniformLocation } {
        //   if (!this._uniforms) {
        //     throw new Error("Uniforms were not retrieved.");
        //   }
        //   return this._uniforms;
        // }
        // get uniformTypes(): { [name: string]: GLSLType } {
        //   if (!this._uniformTypes) {
        //     throw new Error("Uniforms were not retrieved.");
        //   }
        //   return this._uniformTypes;
        // }
        getResource(name) {
            if (name !== "program" && name !== "") {
                return null;
            }
            return {
                program: this._program,
                uniformLocations: this._uniformLocations || {},
                uniformTypes: this._uniformTypes || {}
            };
        }
    }
    exports.ProgramNode = ProgramNode;
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
    class InterleavedMeshNode extends core_1.SimpleResourceNode {
        constructor(parent, _vertexAttribPointers, maxVertices, maxIndices, _drawUsage) {
            super(parent);
            this._vertexAttribPointers = _vertexAttribPointers;
            this._drawUsage = _drawUsage;
            this._vertexBuffer = null;
            this._indexBuffer = null;
            this._vertexSize = 0;
            this._vertexBuffers = [];
            this.indexCount = 0;
            this._vertexSize = 0;
            for (const vap of this._vertexAttribPointers) {
                this._vertexSize += getGLSize(vap.type) * vap.size;
            }
            this._vertexData = new ArrayBuffer(this._vertexSize * maxVertices);
            this._indexData = new Uint16Array(maxIndices);
        }
        get vertexData() {
            return this._vertexData;
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
            let location = 0;
            let offset = 0;
            const attribPointers = [];
            for (const vap of this._vertexAttribPointers) {
                attribPointers.push({
                    location,
                    size: vap.size,
                    type: vap.type,
                    normalized: vap.normalized,
                    stride: this._vertexSize,
                    offset
                });
                location++;
                offset += getGLSize(vap.type) * vap.size;
            }
            this._vertexBuffers.push({
                vertexBuffer: this._vertexBuffer,
                attribPointers: attribPointers
            });
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
        getResource(name) {
            if (name !== "mesh" && name !== "") {
                return null;
            }
            return {
                indexBuffer: this._indexBuffer,
                vertexBuffers: this._vertexBuffers,
                indexCount: this._indexData.length
            };
        }
    }
    exports.InterleavedMeshNode = InterleavedMeshNode;
    class SetProgramNode extends core_1.ContainerNode {
        constructor(parent, _program) {
            super(parent);
            this._program = _program;
        }
        process(state, resources) {
            const { gl, program: previousProgram } = state;
            const program = resources.get(this._program);
            if (!program) {
                return false;
            }
            gl.useProgram(program.program);
            state.program = program;
            const allChildrenProcessed = this.processChildren(state, resources);
            previousProgram && gl.useProgram(previousProgram ? previousProgram.program : null);
            state.program = previousProgram;
            return allChildrenProcessed;
        }
    }
    exports.SetProgramNode = SetProgramNode;
    class SetMeshNode extends core_1.ContainerNode {
        constructor(parent, _mesh) {
            super(parent);
            this._mesh = _mesh;
        }
        process(state, resources) {
            const { gl, mesh: previousMesh } = state;
            const mesh = resources.get(this._mesh);
            if (!mesh) {
                return false;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            for (const vb of mesh.vertexBuffers) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vb.vertexBuffer);
                for (const attr of vb.attribPointers) {
                    gl.enableVertexAttribArray(attr.location);
                    gl.vertexAttribPointer(attr.location, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
            state.mesh = mesh;
            const allChildrenProcessed = this.processChildren(state, resources);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previousMesh ? previousMesh.indexBuffer : null);
            for (const vb of mesh.vertexBuffers) {
                for (const attr of vb.attribPointers) {
                    gl.disableVertexAttribArray(attr.location);
                }
            }
            state.mesh = previousMesh;
            return allChildrenProcessed;
        }
    }
    exports.SetMeshNode = SetMeshNode;
    // export class SetTextures extends ContainerNode<WebGLState> {
    //   constructor(parent: ContainerNode<WebGLState>, private _bindings: { [unit: number]: Texture2D }) {
    //     super(parent);
    //   }
    //   process(state: WebGLState, resources: Map<string, ResourceNode<WebGLState>>): boolean {
    //     const { gl, textures } = state;
    //     let allChildrenProcessed = true;
    //     let allTexturesReady = true;
    //     state.textures = this._bindings;
    //     for (const unit in state.textures) {
    //       gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
    //       const tex = state.textures[parseInt(unit, 10)];
    //       allTexturesReady = allTexturesReady && tex.ready;
    //       tex.ready && tex.bind(gl, parseInt(unit, 10))
    //     }
    //     if (allTexturesReady) {
    //       allChildrenProcessed = this.processChildren(state, resources);
    //     }
    //     state.textures = textures;
    //     for (const unit in state.textures) {
    //       gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
    //       const tex = state.textures[parseInt(unit, 10)];
    //       tex.ready && tex.bind(gl, parseInt(unit, 10))
    //     }
    //     return allChildrenProcessed && allTexturesReady;
    //   }
    // }
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
    class SetUniformsNode extends core_1.ContainerNode {
        constructor(parent) {
            super(parent);
            this.values = {};
        }
        process(state, resources) {
            const { gl, program } = state;
            // TODO: Old values
            for (const name in this.values) {
                const location = program === null || program === void 0 ? void 0 : program.uniformLocations[name];
                const type = program === null || program === void 0 ? void 0 : program.uniformTypes[name];
                if (location && type) {
                    setUniform(gl, location, type, this.values[name]);
                }
            }
            const allChildrenProcessed = this.processChildren(state, resources);
            return allChildrenProcessed;
        }
    }
    exports.SetUniformsNode = SetUniformsNode;
    // state.uniforms = this.values;
    // for (const name in state.uniforms) {
    //   const value = state.uniforms[name];
    //   const location = state.program?.uniforms[name]!;
    //   const type = state.program?.uniformTypes[name]!;
    //   setUniform(gl, location, type, value);
    // }
    // const allChildrenProcessed = this.processChildren(state, resources);
    // state.uniforms = uniforms;
    // for (const name in state.uniforms) {
    //   const value = state.uniforms[name];
    //   const location = state.program?.uniforms[name]!;
    //   const type = state.program?.uniformTypes[name]!;
    //   setUniform(gl, location, type, value);
    // }
    class DrawNode extends core_1.LeafNode {
        constructor(parent) {
            super(parent);
            this.draw = true;
        }
        process(state) {
            const { gl, mesh } = state;
            if (!this.draw) {
                return true;
            }
            if (!mesh) {
                return false;
            }
            gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            return true;
        }
    }
    exports.DrawNode = DrawNode;
});
