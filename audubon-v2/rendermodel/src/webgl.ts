import { SimpleNode, ContainerNode, ResourceNode } from "./core";

export interface WebGLState {
  gl: WebGLRenderingContext;
  clearColor: [number, number, number, number];
  clearDepth: number;
  program: Program | null;
  mesh: Mesh | null;
  textures: { [unit: number]: Texture2D };
  uniforms: { [name: string]: any };
}

export class RenderingContext extends ContainerNode<WebGLState> {
  private _glState: WebGLState;

  constructor(parent: ContainerNode<WebGLState>, gl?: WebGLRenderingContext) {
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

  process(state: WebGLState | null): boolean {
    state = this._glState;
    return this.processChildren(state);
  }

  get width(): number {
    return this._glState.gl.canvas.width;
  }

  get height(): number {
    return this._glState.gl.canvas.height;
  }
}
  
export class Clear extends ContainerNode<WebGLState> {
  private _clearColor: [number, number, number, number];
  private _clearDepth: number;

  constructor(parent: ContainerNode<WebGLState>, clearColor: [number, number, number, number], clearDepth: number) {
    super(parent);
    
    this._clearColor = clearColor;
    this._clearDepth = clearDepth;
  }
  
  process(state: WebGLState) {
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

export class Texture2D extends ResourceNode<WebGLState> {
  private _image: HTMLImageElement | null;
  private _texture: WebGLTexture | null;

  constructor(parent: ContainerNode<WebGLState>, src: string, private _updater: () => HTMLCanvasElement) {
    super(parent);

    this._image = new Image();
    this._image.crossOrigin = "anonymous";
    this._image.src = src;
    this._texture = null;
  }

  load(state: WebGLState): boolean {
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

  destroy(state: WebGLState): boolean {
    const { gl } = state;

    gl.deleteTexture(this._texture);
    this._texture = null;
    this._setDestroyed();

    return true;
  }

  bind(gl: WebGLRenderingContext, unit: number = 0): void {
    if (!this._texture) {
      throw new Error("Texture was not created.");
    }

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  }

  unbind(gl: WebGLRenderingContext, unit: number = 0): void {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  update(state: WebGLState): boolean {
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

  upload(): void {
    this._setInvalidated();
  }
}

export type GLSLType = "int" | "float" | "sampler2D" | "vec2" | "vec3" | "vec4" | "mat2" | "mat3" | "mat4";

export class Program extends ResourceNode<WebGLState> {
  private _program: WebGLProgram | null;
  private _uniforms: { [name: string]: WebGLUniformLocation } | null;
  private _uniformTypes: { [name: string]: GLSLType } | null;

  constructor(parent: ContainerNode<WebGLState>, private _vsSrc: string, private _fsSrc: string, private _attributes: { [name: string]: number }, private _uniformDeclarations: { name: string, type: GLSLType }[]) {
    super(parent);

    this._program = null;
    this._uniforms = null;
    this._uniformTypes = null;
  }

  load(state: WebGLState): boolean {
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

    const uniforms: { [name: string]: WebGLUniformLocation } = {};
    const uniformTypes: { [name: string]: GLSLType } = {};

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

  destroy(state: WebGLState): boolean {
    const { gl } = state;

    if (this._program) {
      gl.deleteProgram(this._program);
      this._program = null;
    }

    return true;
  }

  bind(gl: WebGLRenderingContext): void {
    if (!this._program) {
      throw new Error("Program was not created.");
    }

    gl.useProgram(this._program);
  }

  unbind(gl: WebGLRenderingContext): void {
    gl.useProgram(null);
  }

  get attributes(): { [name: string]: number } {
    return this._attributes;
  }

  get uniforms(): { [name: string]: WebGLUniformLocation } {
    if (!this._uniforms) {
      throw new Error("Uniforms were not retrieved.");
    }

    return this._uniforms;
  }

  get uniformTypes(): { [name: string]: GLSLType } {
    if (!this._uniformTypes) {
      throw new Error("Uniforms were not retrieved.");
    }

    return this._uniformTypes;
  }
}

export type GLType = 5120 | 5122 | 5121 | 5123 | 5126;

export type GLDrawUsage = 35044 | 35048 | 35040;

export interface PackedVertexAttribPointer {
  size: number;
  type: GLType;
  normalized: boolean;
}

export function getGLSize(type: GLType): number {
  return {
    5120: 1,
    5122: 1,
    5121: 2,
    5123: 2,
    5126: 4
  }[type];
}

export class Mesh extends ResourceNode<WebGLState> {
  private _vertexData: ArrayBuffer;
  private _indexData: Uint16Array;
  private _vertexBuffer?: WebGLBuffer;
  private _indexBuffer?: WebGLBuffer;
  private _vertexSize = 0;

  constructor(parent: ContainerNode<WebGLState>, private _vertexAttribPointers: PackedVertexAttribPointer[], maxVertices: number, maxIndices: number, private _drawUsage: GLDrawUsage) {
    super(parent);

    this._vertexSize = 0;

    for (const vap of this._vertexAttribPointers) {
      this._vertexSize += getGLSize(vap.type) * vap.size;
    }

    this._vertexData = new ArrayBuffer(this._vertexSize * maxVertices);
    this._indexData = new Uint16Array(maxIndices);
  }

  indexCount = 0;

  get vertexData(): DataView {
    return new DataView(this._vertexData);
  }
  
  get indexData(): Uint16Array {
    return this._indexData;
  }

  load(state: WebGLState): boolean {
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

  upload(): void {
    this._setInvalidated();
  }
  
  update(state: WebGLState): boolean {
    const { gl } = state;

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer!);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertexData);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer!);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this._indexData);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return true;
  }

  destroy(state: WebGLState): boolean {
    const { gl } = state;

    gl.deleteBuffer(this._vertexBuffer!);
    gl.deleteBuffer(this._indexBuffer!);

    return true;
  }

  bind(gl: WebGLRenderingContext): void {
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

  draw(gl: WebGLRenderingContext): void {
    gl.enable(gl.BLEND); // Do I need this?
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Do I need this?
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND); // Do I need this?
    gl.blendFunc(gl.ONE, gl.ZERO); // Do I need this?
  }

  unbind(gl: WebGLRenderingContext): void {
    for (let i = 0; i < this._vertexAttribPointers.length; i++) {
      gl.disableVertexAttribArray(i);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}

export class SetProgram extends ContainerNode<WebGLState> {
  constructor(parent: ContainerNode<WebGLState>, private _program: Program) {
    super(parent);
  }

  process(state: WebGLState): boolean {
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

export class SetMesh extends ContainerNode<WebGLState> {
  constructor(parent: ContainerNode<WebGLState>, private _mesh: Mesh) {
    super(parent);
  }

  process(state: WebGLState): boolean {
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

export class SetTextures extends ContainerNode<WebGLState> {
  constructor(parent: ContainerNode<WebGLState>, private _bindings: { [unit: number]: Texture2D }) {
    super(parent);
  }

  process(state: WebGLState): boolean {
    const { gl, textures } = state;

    let allChildrenProcessed = true;
    let allTexturesReady = true;

    state.textures = this._bindings;
    for (const unit in state.textures) {
      gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
      const tex = state.textures[parseInt(unit, 10)];
      allTexturesReady = allTexturesReady && tex.ready;
      tex.ready && tex.bind(gl, parseInt(unit, 10))
    }
    if (allTexturesReady) {
      allChildrenProcessed = this.processChildren(state);
    }
    state.textures = textures;
    for (const unit in state.textures) {
      gl.activeTexture(gl.TEXTURE0 + parseInt(unit, 10));
      const tex = state.textures[parseInt(unit, 10)];
      tex.ready && tex.bind(gl, parseInt(unit, 10))
    }
    
    return allChildrenProcessed && allTexturesReady;
  }
}

export function setUniform(gl: WebGLRenderingContext, location: WebGLUniformLocation, type: GLSLType, value: any): void {
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

export class SetUniforms extends ContainerNode<WebGLState> {
  constructor(parent: ContainerNode<WebGLState>) {
    super(parent);
  }

  process(state: WebGLState): boolean {
    const { gl, uniforms } = state;

    state.uniforms = this.values;
    for (const name in state.uniforms) {
      const value = state.uniforms[name];
      const location = state.program?.uniforms[name]!;
      const type = state.program?.uniformTypes[name]!;
      setUniform(gl, location, type, value);
    }
    const allChildrenProcessed = this.processChildren(state);
    state.uniforms = uniforms;
    for (const name in state.uniforms) {
      const value = state.uniforms[name];
      const location = state.program?.uniforms[name]!;
      const type = state.program?.uniformTypes[name]!;
      setUniform(gl, location, type, value);
    }

    return allChildrenProcessed;
  }

  values: { [name: string]: any } = {};
}

export class Draw extends SimpleNode<WebGLState> {
  constructor(parent: ContainerNode<WebGLState>) {
    super(parent);
  }

  process(state: WebGLState): boolean {
    const { gl } = state;

    if (!this.visible) {
      return true;
    }

    if (!state.mesh) {
      return false;
    }

    state.mesh!.draw(gl);

    return true;
  }

  visible = true;
}