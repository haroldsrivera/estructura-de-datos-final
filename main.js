import {mazegen} from './laberinto.js';

// Ancho de configuración de la ventana
const _CONFIG_WIDTH = 1920;

// Alto de configuración de la ventana
const _CONFIG_HEIGHT = 1080;

// Número de baldosas en el eje X
const _TILES_X = 64;

// Número de baldosas en el eje Y, calculado como la mitad de _TILES_X
const _TILES_Y = _TILES_X / 2;

// Tiempo por paso, se asume una tasa de 30 pasos por segundo
const _TIME_PER_STEP = 1.0 / 30.0;

// Número de nodos en la capa
const _LAYER_NODES = 100;

// Número de bordes en la capa
const _LAYER_EDGES = 50;

// Número de elementos de la capa de pared
const _LAYER_WALL = 10;

// Número de elementos de la capa de fondo
const _LAYER_BG = 0; // Esto parece ser una capa de fondo sin elementos, o una capa desactivada



class SquareSprite {
    constructor(scene, node, nodes) {
      // Constructor de la clase SquareSprite, que toma una escena, un nodo y nodos como parámetros.
      this._node = node; // El nodo asociado a esta instancia de SquareSprite.
      this._nodes = nodes; // Lista de nodos.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._gfx = null; // Variable para almacenar la representación gráfica.
      this._text = null; // Variable para almacenar texto.
      this._params = {
        tint: 0xFFFFFF, // Color de tinte predeterminado.
        start: false, // Indicador de inicio.
        end: false, // Indicador de final.
        fScore: '', // Puntuación f.
        gScore: 0, // Puntuación g inicializada en 0.
      };
      this._Redraw({}); // Llamar al método _Redraw con un objeto vacío como parámetro para configurar la representación inicial.
    }
  
    destroy() {
      // Método para destruir la representación gráfica y el texto asociado.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
  
      if (this._text != null) {
        this._text.destroy();
      }
    }
  
    Redraw(params) {
      // Método para actualizar la representación gráfica en función de los parámetros proporcionados.
      let changed = false;
      for (const k in this._params) {
        if (k in params && this._params[k] != params[k]) {
          changed = true;
          this._params[k] = params[k];
        }
      }
  
      if (changed || 1) {
        this._Redraw(); // Llamar al método _Redraw si se han producido cambios o siempre que se llame a este método.
      }
    }
  
    _Redraw() {
      // Método para dibujar la representación gráfica del cuadro.
      const x = this._node.metadata.position[0]; // Coordenada X del nodo.
      const y = this._node.metadata.position[1]; // Coordenada Y del nodo.
      const w = _CONFIG_WIDTH / _TILES_X; // Ancho del cuadro en función del tamaño de las baldosas.
      const h = _CONFIG_HEIGHT / _TILES_Y; // Alto del cuadro en función del tamaño de las baldosas.
  
      if (this._gfx != null) {
        this._gfx.destroy();
      }
      this._gfx = this._scene.add.graphics(0, 0); // Crear una representación gráfica.
      this._gfx.lineStyle(w / 60.0, 0xC0C0C0, 1.0); // Estilo de línea.
      this._gfx.fillStyle(this._params.tint, 1.0); // Color de relleno.
      this._gfx.fillRect(x * w, y * h, w, h); // Dibujar un cuadro en la posición adecuada.
  
      this._gfx.displayOriginX = 0;
      this._gfx.displayOriginY = 0;
      this._gfx.setDepth(_LAYER_BG); // Establecer la profundidad de la representación gráfica.
    }
  }
  

  class WallRenderer {
    constructor(scene, nodes) {
      // Constructor de la clase WallRenderer, que toma una escena y nodos como parámetros.
      this._nodes = nodes; // Lista de nodos.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._gfx = null; // Variable para almacenar la representación gráfica.
    }
  
    destroy() {
      // Método para destruir la representación gráfica.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
    }
  
    get visible() {
      return this._visible; // Propiedad getter para obtener el valor de `_visible`.
    }
  
    set visible(v) {
      this._visible = v; // Propiedad setter para establecer el valor de `_visible`.
    }
  
    Redraw() {
      // Método para dibujar la representación gráfica de las paredes.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
      this._gfx = this._scene.add.graphics(0, 0); // Crear una representación gráfica.
  
      const edges = {};
  
      for (const k in this._nodes) {
        const curNode = this._nodes[k];
        const x = curNode.metadata.position[0]; // Coordenada X del nodo.
        const y = curNode.metadata.position[1]; // Coordenada Y del nodo.
        const w = _CONFIG_WIDTH / _TILES_X; // Ancho del cuadro en función del tamaño de las baldosas.
        const h = _CONFIG_HEIGHT / _TILES_Y; // Alto del cuadro en función del tamaño de las baldosas.
  
        this._gfx.lineStyle(w / 60.0, 0xC0C0C0, 1.0); // Estilo de línea.
        if (curNode.metadata.render.active) {
          this._gfx.fillStyle(0x8080FF, 1.0); // Color de relleno para nodos activos.
        } else if (curNode.metadata.render.visited) {
          this._gfx.fillStyle(0xFFFFFF, 1.0); // Color de relleno para nodos visitados.
        } else {
          this._gfx.fillStyle(0x808080, 1.0); // Color de relleno predeterminado.
        }
        this._gfx.fillRect(x * w, y * h, w, h); // Dibujar un cuadro en la posición adecuada.
  
        const neighbours = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // Definir las coordenadas de los vecinos.
  
        this._gfx.lineStyle(w * 0.05, 0x000000, 1.0); // Estilo de línea para las conexiones entre nodos.
        this._gfx.beginPath();
        for (let ni = 0; ni < neighbours.length; ni++) {
          const n = neighbours[ni];
          const ki = _Key(x + n[0], y + n[1]);
  
          if (curNode.edges.indexOf(_Key(x, y + 1)) < 0) {
            this._gfx.moveTo(w * (x + 0.0), h * (y + 1.0));
            this._gfx.lineTo(w * (x + 1.0), h * (y + 1.0));
          }
  
          if (curNode.edges.indexOf(_Key(x + 1, y + 0)) < 0) {
            this._gfx.moveTo(w * (x + 1.0), h * (y + 0.0));
            this._gfx.lineTo(w * (x + 1.0), h * (y + 1.0));
          }
  
          if (curNode.edges.indexOf(_Key(x, y - 1)) < 0) {
            this._gfx.moveTo(w * (x + 0.0), h * (y + 0.0));
            this._gfx.lineTo(w * (x + 1.0), h * (y + 0.0));
          }
  
          if (curNode.edges.indexOf(_Key(x - 1, y)) < 0) {
            this._gfx.moveTo(w * (x + 0.0), h * (y + 0.0));
            this._gfx.lineTo(w * (x + 0.0), h * (y + 1.0));
          }
        }
        this._gfx.closePath();
        this._gfx.strokePath();
      }
  
      this._gfx.displayOriginX = 0;
      this._gfx.displayOriginY = 0;
      this._gfx.setDepth(_LAYER_WALL); // Establecer la profundidad de la representación gráfica.
      this._gfx.setVisible(this._visible); // Establecer la visibilidad de la representación gráfica.
    }
  }
  

  class PotentialEdgeRenderer {
    constructor(scene, nodes) {
      // Constructor de la clase PotentialEdgeRenderer, que toma una escena y nodos como parámetros.
      this._nodes = nodes; // Lista de nodos.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._gfx = null; // Variable para almacenar la representación gráfica.
    }
  
    destroy() {
      // Método para destruir la representación gráfica.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
    }
  
    get visible() {
      return this._visible; // Propiedad getter para obtener el valor de `_visible`.
    }
  
    set visible(v) {
      this._visible = v; // Propiedad setter para establecer el valor de `_visible`.
    }
  
    Redraw() {
      // Método para dibujar la representación gráfica de las posibles conexiones entre nodos.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
      this._gfx = this._scene.add.graphics(0, 0); // Crear una representación gráfica.
  
      const edges = {};
  
      for (const k in this._nodes) {
        const curNode = this._nodes[k];
        const x = curNode.metadata.position[0]; // Coordenada X del nodo.
        const y = curNode.metadata.position[1]; // Coordenada Y del nodo.
        const w = _CONFIG_WIDTH / _TILES_X; // Ancho del cuadro en función del tamaño de las baldosas.
        const h = _CONFIG_HEIGHT / _TILES_Y; // Alto del cuadro en función del tamaño de las baldosas.
  
        for (let nk of curNode.potentialEdges) {
          if ((k + '.' + nk) in edges ||
              (nk + '.' + k) in edges) {
            continue;
          }
          const neighbourNode = this._nodes[nk];
          const x1 = neighbourNode.metadata.position[0];
          const y1 = neighbourNode.metadata.position[1];
  
          if (curNode.metadata.render.active) {
            if (neighbourNode.metadata.render.visited) {
              this._gfx.lineStyle(w * 0.025, 0xFF8080, 1.0); // Estilo de línea para conexiones entre nodos activos y visitados.
            } else {
              this._gfx.lineStyle(w * 0.025, 0x80FF80, 1.0); // Estilo de línea para conexiones entre nodos activos.
            }
          } else if (neighbourNode.metadata.render.active) {
            if (curNode.metadata.render.visited) {
              this._gfx.lineStyle(w * 0.025, 0xFF8080, 1.0); // Estilo de línea para conexiones entre nodos activos y visitados.
            } else {
              this._gfx.lineStyle(w * 0.025, 0x80FF80, 1.0); // Estilo de línea para conexiones entre nodos activos.
            }
          } else {
            if (curNode.edges.indexOf(nk) >= 0) {
              this._gfx.lineStyle(w * 0.025, 0x0000FF, 1.0); // Estilo de línea para conexiones entre nodos conectados.
            } else {
              this._gfx.lineStyle(w * 0.001, 0x000000, 1.0); // Estilo de línea para conexiones entre nodos no conectados.
            }
          }
  
          this._gfx.beginPath();
          this._gfx.moveTo(w * (x + 0.5), h * (y + 0.5));
          this._gfx.lineTo(w * (x1 + 0.5), h * (y1 + 0.5));
          this._gfx.closePath();
          this._gfx.strokePath();
  
          edges[k + '.' + nk] = true;
          edges[nk + '.' + k] = true;
        }
      }
      this._gfx.displayOriginX = 0;
      this._gfx.displayOriginY = 0;
      this._gfx.setDepth(_LAYER_EDGES); // Establecer la profundidad de la representación gráfica.
      this._gfx.setVisible(this._visible); // Establecer la visibilidad de la representación gráfica.
    }
  }
  

  class EdgeRenderer {
    constructor(scene, nodes) {
      // Constructor de la clase EdgeRenderer, que toma una escena y nodos como parámetros.
      this._nodes = nodes; // Lista de nodos.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._gfx = null; // Variable para almacenar la representación gráfica.
      this._visible = false; // Propiedad para controlar la visibilidad de la representación gráfica, inicializada en falso.
    }
  
    destroy() {
      // Método para destruir la representación gráfica.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
    }
  
    get visible() {
      return this._visible; // Propiedad getter para obtener el valor de `_visible`.
    }
  
    set visible(v) {
      this._visible = v; // Propiedad setter para establecer el valor de `_visible`.
    }
  
    Redraw() {
      // Método para dibujar la representación gráfica de las conexiones entre nodos.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
      this._gfx = this._scene.add.graphics(0, 0); // Crear una representación gráfica.
  
      const edges = {};
  
      for (const k in this._nodes) {
        const curNode = this._nodes[k];
        const x = curNode.metadata.position[0]; // Coordenada X del nodo.
        const y = curNode.metadata.position[1]; // Coordenada Y del nodo.
        const w = _CONFIG_WIDTH / _TILES_X; // Ancho del cuadro en función del tamaño de las baldosas.
        const h = _CONFIG_HEIGHT / _TILES_Y; // Alto del cuadro en función del tamaño de las baldosas.
  
        for (let nk of curNode.edges) {
          if ((k + '.' + nk) in edges ||
              (nk + '.' + k) in edges) {
            continue;
          }
          const neighbourNode = this._nodes[nk];
          const x1 = neighbourNode.metadata.position[0];
          const y1 = neighbourNode.metadata.position[1];
  
          this._gfx.lineStyle(w * 0.025, 0x000000, 1.0); // Estilo de línea.
  
          this._gfx.beginPath();
          this._gfx.moveTo(w * (x + 0.5), h * (y + 0.5));
          this._gfx.lineTo(w * (x1 + 0.5), h * (y1 + 0.5));
          this._gfx.closePath();
          this._gfx.strokePath();
  
          edges[k + '.' + nk] = true;
          edges[nk + '.' + k] = true;
        }
      }
      this._gfx.displayOriginX = 0;
      this._gfx.displayOriginY = 0;
      this._gfx.setDepth(_LAYER_EDGES); // Establecer la profundidad de la representación gráfica.
      this._gfx.setVisible(this._visible); // Establecer la visibilidad de la representación gráfica.
    }
  }
  

  class NodeRenderer {
    constructor(scene, nodes) {
      // Constructor de la clase NodeRenderer, que toma una escena y nodos como parámetros.
      this._nodes = nodes; // Lista de nodos.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._gfx = null; // Variable para almacenar la representación gráfica.
      this._visible = false; // Propiedad para controlar la visibilidad de la representación gráfica, inicializada en falso.
    }
  
    destroy() {
      // Método para destruir la representación gráfica.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
    }
  
    get visible() {
      return this._visible; // Propiedad getter para obtener el valor de `_visible`.
    }
  
    set visible(v) {
      this._visible = v; // Propiedad setter para establecer el valor de `_visible`.
    }
  
    Redraw() {
      // Método para dibujar la representación gráfica de los nodos.
      if (this._gfx != null) {
        this._gfx.destroy();
      }
      this._gfx = this._scene.add.graphics(0, 0); // Crear una representación gráfica.
  
      for (const k in this._nodes) {
        const node = this._nodes[k];
        const x = node.metadata.position[0]; // Coordenada X del nodo.
        const y = node.metadata.position[1]; // Coordenada Y del nodo.
        const w = _CONFIG_WIDTH / _TILES_X; // Ancho del cuadro en función del tamaño de las baldosas.
        const h = _CONFIG_HEIGHT / _TILES_Y; // Alto del cuadro en función del tamaño de las baldosas.
  
        if (node.metadata.render.visited) {
          this._gfx.fillStyle(0xFF8080, 1.0); // Color de relleno para nodos visitados.
        } else {
          this._gfx.fillStyle(0x80FF80, 1.0); // Color de relleno para nodos no visitados.
        }
        this._gfx.fillCircle(w * (x + 0.5), h * (y + 0.5), w * 0.1); // Dibujar un círculo en la posición adecuada.
      }
      this._gfx.displayOriginX = 0;
      this._gfx.displayOriginY = 0;
      this._gfx.setDepth(_LAYER_NODES); // Establecer la profundidad de la representación gráfica.
      this._gfx.setVisible(this._visible); // Establecer la visibilidad de la representación gráfica.
    }
  }
  

  function _Key(x, y) {
    // Esta función toma dos valores x e y como entrada y devuelve una cadena que los concatena con un punto en el medio.
    return x + '.' + y;
  }
  

  function _Distance(p1, p2) {
    // Esta función calcula la distancia euclidiana entre dos puntos p1 y p2 en un espacio bidimensional.
    // La fórmula es la raíz cuadrada de la suma de los cuadrados de las diferencias en las coordenadas x e y.
    return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5;
  }
  


  class AStarRenderer {
    constructor(nodes, scene) {
      // Constructor de la clase AStarRenderer, que toma nodos y una escena como parámetros.
      this._scene = scene; // La escena a la que se asocia esta instancia.
      this._nodes = nodes; // Lista de nodos.
      this._edgeRenderer = new EdgeRenderer(scene, nodes); // Instancia de EdgeRenderer para representar conexiones entre nodos.
      this._potentialEdgeRenderer = new PotentialEdgeRenderer(scene, nodes); // Instancia de PotentialEdgeRenderer para representar conexiones potenciales entre nodos.
      this._nodeRenderer = new NodeRenderer(scene, nodes); // Instancia de NodeRenderer para representar nodos.
      this._wallRenderer = new WallRenderer(scene, nodes); // Instancia de WallRenderer para representar paredes.
      this._wallRenderer._visible = true; // Establecer la visibilidad del renderizador de paredes a verdadero.
      this._sprites = {}; // Objeto para almacenar representaciones gráficas de fondo de nodos.
    }
  
    destroy() {
      // Método para destruir todas las representaciones gráficas.
      for (const k in this._sprites) {
        this._sprites[k].destroy();
      }
  
      this._nodeRenderer.destroy();
      this._edgeRenderer.destroy();
      this._potentialEdgeRenderer.destroy();
      this._wallRenderer.destroy();
    }
  
    Update(touched) {
      // Método para actualizar las representaciones gráficas.
  
      // Si no se especifica qué nodos se tocaron, se asumen todos.
      if (touched == null) {
        touched = Object.keys(this._nodes);
      }
  
      // Actualizar las representaciones gráficas de los nodos tocados.
      for (const k of touched) {
        const node = this._nodes[k];
        const k_bg = k + '.bg';
  
        // Si no existe una representación gráfica de fondo para este nodo, créala.
        if (!(k_bg in this._sprites)) {
          this._sprites[k_bg] = new SquareSprite(this._scene, node, this._nodes);
        }
  
        const params = {};
  
        // Determinar el color de fondo en función del estado del nodo.
        if (node.metadata.render.visited) {
          params.tint = 0xFFFFFF; // Blanco para nodos visitados.
        } else {
          params.tint = 0x808080; // Gris para nodos no visitados.
        }
  
        if (node.metadata.render.active) {
          params.tint = 0x8080FF; // Azul para nodos activos.
        }
  
        // Redibujar la representación gráfica de fondo del nodo.
        this._sprites[k_bg].Redraw(params);
      }
  
      // Redibujar las otras representaciones gráficas.
      this._nodeRenderer.Redraw();
      this._edgeRenderer.Redraw();
      this._potentialEdgeRenderer.Redraw();
      this._wallRenderer.Redraw();
    }
  }
  


  class Graph {
    constructor() {
      // Constructor de la clase Graph, que inicializa una estructura de datos para almacenar nodos.
      this._nodes = {};
    }
  
    get Nodes() {
      return this._nodes; // Propiedad getter para obtener los nodos del grafo.
    }
  
    AddNode(k, e, m) {
      // Método para agregar un nodo al grafo.
      // k: Clave única del nodo.
      // e: Arreglo de claves de nodos conectados (aristas).
      // m: Metadatos asociados al nodo.
      this._nodes[k] = {
        edges: [...e], // Lista de aristas conectadas.
        potentialEdges: [...e], // Lista de aristas potenciales.
        metadata: m, // Metadatos asociados al nodo.
      };
    }
  }
  


  class MazeGenDemo {
    constructor() {
      // Constructor de la clase MazeGenDemo.
      this._game = this._CreateGame(); // Inicializa el juego.
    }
  
    _CreateGame() {
      // Método para crear el juego utilizando Phaser.
      const self = this;
      const config = {
        type: Phaser.AUTO,
        scene: {
          preload: function () { self._OnPreload(this); },
          create: function () { self._OnCreate(this); },
          update: function () { self._OnUpdate(this); },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: _CONFIG_WIDTH,
          height: _CONFIG_HEIGHT,
        },
      };
  
      return new Phaser.Game(config); // Crea una instancia del juego.
    }
  
    _Reset() {
      // Método para restablecer el juego.
      this._astarRenderer.destroy(); // Destruye la representación gráfica.
      this._Init(); // Inicializa el juego nuevamente.
    }
  
    _Init() {
      // Método para inicializar el juego.
      this._stepTime = 0.0;
      this._previousFrame = null;
      this._graph = new Graph(); // Crea un grafo vacío.
  
      // Crea nodos y agrega metadatos al grafo.
      for (let x = 0; x < _TILES_X; x++) {
        for (let y = 0; y < _TILES_Y; y++) {
          const k = _Key(x, y);
          this._graph.AddNode(
            k, [],
            {
              position: [x, y],
              weight: 0,
              render: {
                visited: false,
              },
            }
          );
        }
      }
  
      // Agrega conexiones potenciales entre nodos.
      for (let x = 0; x < _TILES_X; x++) {
        for (let y = 0; y < _TILES_Y; y++) {
          const k = _Key(x, y);
  
          for (let xi = -1; xi <= 1; xi++) {
            for (let yi = -1; yi <= 1; yi++) {
              if (xi == 0 && yi == 0 || (Math.abs(xi) + Math.abs(yi) != 1)) {
                continue;
              }
  
              const ki = _Key(x + xi, y + yi);
  
              if (ki in this._graph.Nodes) {
                this._graph.Nodes[k].potentialEdges.push(ki);
              }
            }
          }
        }
      }
  
      const start = _Key(0, 0);
      const end = _Key(4, 0);
  
      // Crea un generador de laberintos y un iterador para generar el laberinto.
      this._mazeGenerator = new mazegen.MazeGenerator(this._graph.Nodes);
      this._mazeIterator = this._mazeGenerator.GenerateIteratively(start);
  
      // Crea un renderizador A* para la visualización.
      this._astarRenderer = new AStarRenderer(this._graph.Nodes, this._scene);
    }
  
    _OnPreload(scene) {
      this._scene = scene;
      // /this._scene.load.image('sky', 'assets/sky.png');
    }
  
    _OnCreate(scene) {
      // Método que se llama cuando se crea la escena del juego.
      this._keys = {
        f: this._scene.input.keyboard.addKey('F'),
        r: this._scene.input.keyboard.addKey('R'),
        n: this._scene.input.keyboard.addKey('N'),
        e: this._scene.input.keyboard.addKey('E'),
        p: this._scene.input.keyboard.addKey('P'),
        w: this._scene.input.keyboard.addKey('W'),
      };
  
      // Configura eventos de teclado para cambiar la visibilidad de representaciones gráficas.
      this._keys.w.on('down', function () {
        this._astarRenderer._wallRenderer.visible = !this._astarRenderer._wallRenderer.visible;
      }, this);
  
      this._keys.n.on('down', function () {
        this._astarRenderer._nodeRenderer.visible = !this._astarRenderer._nodeRenderer.visible;
      }, this);
  
      this._keys.e.on('down', function () {
        this._astarRenderer._edgeRenderer.visible = !this._astarRenderer._edgeRenderer.visible;
      }, this);
  
      this._keys.p.on('down', function () {
        this._astarRenderer._potentialEdgeRenderer.visible = !this._astarRenderer._potentialEdgeRenderer.visible;
      }, this);
  
      this._keys.r.on('down', function () {
        this._Reset();
      }, this);
  
      this._keys.f.on('down', function () {
        this._mazeIterator.next();
      }, this);
  
      this._Init(); // Inicializa el juego.
    }
  
    _OnUpdate(scene) {
      // Método que se llama en cada fotograma de actualización del juego.
      const currentFrame = scene.time.now;
      if (this._previousFrame == null) {
        this._previousFrame = currentFrame;
        this._astarRenderer.Update(null);
      }
  
      const timeElapsedInS = Math.min(
        (currentFrame - this._previousFrame) / 1000.0, 1.0 / 30.0);
  
      let touched = [];
      this._stepTime += timeElapsedInS;
      while (this._stepTime >= _TIME_PER_STEP) {
        this._stepTime -= _TIME_PER_STEP;
        const r = this._mazeIterator.next();
        if (r.done) {
          setTimeout(() => {
            this._Reset();
          }, 2000);
        }
      }
  
      this._astarRenderer.Update(null);
  
      this._previousFrame = currentFrame;
    }
  }
  
  const _GAME = new MazeGenDemo(); // Crea una instancia de la clase MazeGenDemo.
  
