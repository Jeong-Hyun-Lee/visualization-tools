import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Edge, Graph, Node } from '@antv/x6';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Stencil } from '@antv/x6-plugin-stencil';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { Transform } from '@antv/x6-plugin-transform';

const COLOR_PORT_GRAY = '#C2C8D5';
const COLOR_PORT_BLUE = '#5F95FF';
const DISCONNECTOR_SWITCH_CENTER = { x: -2, y: -2 };
const DISCONNECTOR_SWITCH_OPEN = `rotate(-30 ${DISCONNECTOR_SWITCH_CENTER.x} ${DISCONNECTOR_SWITCH_CENTER.y})`;
const DISCONNECTOR_SWITCH_CLOSE = `rotate(-10 ${DISCONNECTOR_SWITCH_CENTER.x} ${DISCONNECTOR_SWITCH_CENTER.y})`;

const SLD_PORTS_BREAKER = buildSldPorts('horizontal');
/** 부하/발전기: 정사각형 바운딩. refR는 X6 refRInscribed(짧은 변 기준)로 w·h 리사이즈에 맞춤 */
const SLD_LOAD_W = 56;
const SLD_LOAD_H = 56;
const SLD_LOAD_RING_R = 26;
const SLD_PORTS_LOAD = buildSldPorts('all');
/** 2권선 겹침(교집합). 기본 90×56 */
const SLD_TR_W = 80;
const SLD_TR_H = 56;
const SLD_PORTS_TRANSFORMER = buildSldPorts('horizontal');
const SLD_PORTS_DISCONNECTOR = buildSldPorts('horizontal');
const SLD_PORTS_GROUND = buildSldPorts('vertical');
const SLD_PORTS_GENERATOR = buildSldPorts('all');

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stencilHost', { static: true })
  stencilHost!: ElementRef<HTMLDivElement>;

  @ViewChild('graphHost', { static: true })
  graphHost!: ElementRef<HTMLDivElement>;

  private graph?: Graph;
  private stencil?: Stencil;

  stencilLoaded = false;
  stencilError: string | null = null;

  private spaceDown = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    ensureGlobalX6Styles();
    registerSldEdge();
    registerSldShapes();

    this.initGraph();
    this.loadStencil();
  }

  ngOnDestroy(): void {
    this.stencil?.dispose();
    this.stencil = undefined;

    this.graph?.dispose();
    this.graph = undefined;
  }

  @HostListener('document:keydown', ['$event'])
  onDocKeydown(ev: KeyboardEvent): void {
    if (ev.code !== 'Space' || this.spaceDown) {
      return;
    }
    const target = ev.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true')
    ) {
      return;
    }

    this.spaceDown = true;
    this.graph?.disableSelection?.();
  }

  @HostListener('document:keyup', ['$event'])
  onDocKeyup(ev: KeyboardEvent): void {
    if (ev.code !== 'Space') {
      return;
    }
    this.spaceDown = false;
    this.graph?.enableSelection?.();
  }

  zoomToFit(): void {
    // this.graph?.zoomToFit({ padding: 0, maxScale: 1.25, minScale: 0.2 });
    this.graph?.centerContent?.({ padding: 0 });
  }

  undo(): void {
    if (this.graph?.canUndo()) {
      this.graph.undo();
    }
  }

  redo(): void {
    if (this.graph?.canRedo()) {
      this.graph.redo();
    }
  }

  canUndo(): boolean {
    return this.graph?.canUndo() ?? false;
  }

  canRedo(): boolean {
    return this.graph?.canRedo() ?? false;
  }

  deleteSelected(): void {
    if (!this.graph) {
      return;
    }
    const cells = this.graph.getSelectedCells();
    if (cells.length) {
      this.graph.removeCells(cells);
    }
  }

  private initGraph(): void {
    let g: Graph;
    g = new Graph({
      container: this.graphHost.nativeElement,
      autoResize: true,
      grid: true,
      panning: {
        enabled: true,
        modifiers: ['space'],
        eventTypes: ['leftMouseDown', 'rightMouseDown'],
      },
      mousewheel: {
        enabled: true,
        minScale: 0.5,
        maxScale: 3,
      },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        router: {
          name: 'manhattan',
          args: {
            offset: 'center',
          },
        },
        connector: { name: 'rounded', args: { radius: 8 } },
        createEdge: (): Edge =>
          g.createEdge({
            shape: 'sld-edge',
            attrs: {
              line: {
                stroke: '#1F1F1F',
                strokeWidth: 2,
              },
            },
          }),
        validateMagnet: ({ magnet }) =>
          magnet.getAttribute('port-group') !== null,
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              stroke: COLOR_PORT_BLUE,
            },
          },
        },
      },
    });

    g.use(new Snapline({ enabled: true }));
    g.use(
      new Transform({
        rotating: true,
        resizing: true,
      }),
    );
    g.use(
      new Selection({
        enabled: true,
        multiple: true,
        rubberband: true,
        movable: true,
        // 기본(false)이면 클릭 중 미세 이동만 있어도 선택이 무시됨 → Transform/팬과 함께 쓸 때 자주 재현됨
        selectCellOnMoved: true,
        selectNodeOnMoved: true,
        selectEdgeOnMoved: true,
        // Transform 플러그인과 동시에 켜면 선택 박스/리사이즈 박스가 겹쳐 어긋난 것처럼 보일 수 있음
        showNodeSelectionBox: true,
      }),
    );
    g.use(new History({ enabled: true }));
    g.use(new Keyboard({ enabled: true }));
    g.use(new Clipboard({ enabled: true }));

    g.bindKey(['del', 'backspace'], () => {
      const cells = g.getSelectedCells();
      if (cells.length) {
        g.removeCells(cells);
      }
    });
    g.bindKey(['meta+z', 'ctrl+z'], () => g.canUndo() && g.undo());
    g.bindKey(['meta+shift+z', 'ctrl+shift+z', 'meta+y', 'ctrl+y'], () => {
      if (g.canRedo()) {
        g.redo();
      }
    });

    g.bindKey(['meta+a', 'ctrl+a'], () => {
      const nodes = g.getNodes();
      if (nodes) {
        g.select(nodes);
      }
    });

    g.bindKey(['meta+c', 'ctrl+c'], () => {
      const cells = g.getSelectedCells();
      if (cells.length) {
        g.copy(cells);
      }
      return false;
    });
    g.bindKey(['meta+x', 'ctrl+x'], () => {
      const cells = g.getSelectedCells();
      if (cells.length) {
        g.cut(cells);
        // `cut()`은 실제로 셀을 제거하므로 선택 상태를 정리해야 합니다.
        g.cleanSelection();
      }
      return false;
    });
    g.bindKey(['meta+v', 'ctrl+v'], () => {
      if (!g.isClipboardEmpty()) {
        const pastedCells = g.paste({ offset: { dx: 32, dy: 32 } });
        g.cleanSelection();
        if (pastedCells.length) {
          g.select(pastedCells);
        }
      }
      return false;
    });

    g.on('history:change', () => this.cdr.markForCheck());

    this.bindPortHover(g);
    this.bindEdgeTools(g);
    this.bindPortStateWithEdges(g);
    this.bindDisconnectorSwitch(g);

    this.graph = g;
    this.initStencil(g);
  }

  private initStencil(graph: Graph): void {
    const stencil = new Stencil({
      title: '전기 단선도 팔레트',
      target: graph,
      stencilGraphWidth: 240,
      stencilGraphHeight: 480,
      layoutOptions: { columns: 1, columnWidth: 230, rowHeight: 88, dx: 8 },
      groups: [
        {
          title: '노드 그룹',
          collapsable: false,
          name: 'sld-node',
          graphHeight: 360,
          layoutOptions: { rowHeight: 88 },
        },
        {
          title: '기타 그룹',
          collapsable: false,
          name: 'sld-other',
          graphHeight: 280,
          layoutOptions: { rowHeight: 88 },
        },
      ],
    });
    this.stencilHost.nativeElement.appendChild(
      stencil.container as HTMLElement,
    );
    this.stencil = stencil;
  }

  private loadStencil(): void {
    this.stencilError = null;
    this.loadStencilGroups();
    this.stencilLoaded = true;
    this.cdr.markForCheck();
  }

  private loadStencilGroups(): void {
    if (!this.stencil) {
      return;
    }

    if (this.graph) {
      this.stencil.load(
        [
          buildSldBusMeta(buildSldPorts('horizontal')),
          buildSldBreakerMeta(SLD_PORTS_BREAKER),
          buildSldLoadMeta(SLD_PORTS_LOAD),
          buildSldTransformerMeta(SLD_PORTS_TRANSFORMER),
        ],
        'sld-node',
      );

      this.stencil.load(
        [
          buildSldDisconnectorMeta(SLD_PORTS_DISCONNECTOR),
          buildSldGroundMeta(SLD_PORTS_GROUND),
          buildSldGeneratorMeta(SLD_PORTS_GENERATOR),
        ],
        'sld-other',
      );
    }
  }

  private bindPortHover(graph: Graph): void {
    graph.on('node:mouseenter', ({ node }) => {
      this.showNodePorts(node, true);
    });
    graph.on('node:mouseleave', ({ node }) => {
      this.showNodePorts(node, false);
    });
  }

  private bindEdgeTools(graph: Graph): void {
    graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools({ name: 'button-remove', args: { distance: -40 } });
    });
    graph.on('edge:mouseleave', ({ edge }) => {
      edge.removeTools();
    });
  }

  private bindPortStateWithEdges(graph: Graph): void {
    graph.on(
      'edge:connected',
      ({
        currentCell,
        currentPort,
      }: {
        currentCell: Node;
        currentPort?: string;
      }) => {
        if (!currentPort) {
          return;
        }
        // 연결 상태 색만 갱신하고, visibility는 hover에서만 제어합니다.
        this.setPortColor(currentCell, currentPort, COLOR_PORT_BLUE);
      },
    );

    graph.on('edge:added', ({ edge }) => {
      this.withNodePort(
        edge.getSourceCellId(),
        edge.getSourcePortId(),
        (n, p) => this.setPortColor(n, p, COLOR_PORT_BLUE),
      );
      this.withNodePort(
        edge.getTargetCellId(),
        edge.getTargetPortId(),
        (n, p) => this.setPortColor(n, p, COLOR_PORT_BLUE),
      );
    });

    graph.on('edge:removed', ({ edge }) => {
      this.withNodePort(
        edge.getSourceCellId(),
        edge.getSourcePortId(),
        (n, p) => {
          if (!this.isPortConnected(n, p))
            this.setPortColor(n, p, COLOR_PORT_GRAY);
        },
      );
      this.withNodePort(
        edge.getTargetCellId(),
        edge.getTargetPortId(),
        (n, p) => {
          if (!this.isPortConnected(n, p))
            this.setPortColor(n, p, COLOR_PORT_GRAY);
        },
      );
    });
  }

  private bindDisconnectorSwitch(graph: Graph): void {
    graph.on('node:click', ({ node }) => {
      if (node.shape !== 'sld-disconnector') {
        return;
      }

      const attrPath = 'attrs/switch/transform';
      const current = node.prop(attrPath) as string | undefined;
      const target =
        current === DISCONNECTOR_SWITCH_OPEN
          ? DISCONNECTOR_SWITCH_CLOSE
          : DISCONNECTOR_SWITCH_OPEN;

      node.transition(attrPath, target, {
        interp: (a: string, b: string) => {
          const reg = /-?\d+(\.\d+)?/g;
          const start = parseFloat(a.match(reg)?.[0] ?? '-30');
          const end = parseFloat(b.match(reg)?.[0] ?? '-10');
          const delta = end - start;
          return (t: number) =>
            `rotate(${start + delta * t} ${DISCONNECTOR_SWITCH_CENTER.x} ${DISCONNECTOR_SWITCH_CENTER.y})`;
        },
      });
    });
  }

  private isPortConnected(node: Node, portId: string): boolean {
    if (!this.graph) {
      return false;
    }
    const edges = this.graph.getConnectedEdges(node);
    return edges.some((e) => {
      return (
        (e.getSourceCellId() === node.id && e.getSourcePortId() === portId) ||
        (e.getTargetCellId() === node.id && e.getTargetPortId() === portId)
      );
    });
  }

  private setPortVisible(node: Node, portId: string, visible: boolean): void {
    node.setPortProp(
      portId,
      'attrs/circle/style/visibility',
      visible ? 'visible' : 'hidden',
    );
  }

  private setPortColor(node: Node, portId: string, color: string): void {
    node.setPortProp(portId, 'attrs/circle/fill', color);
    node.setPortProp(portId, 'attrs/circle/stroke', color);
  }

  private setPortDot(
    node: Node,
    portId: string,
    visible: boolean,
    color?: string,
  ): void {
    this.setPortVisible(node, portId, visible);
    if (color) {
      this.setPortColor(node, portId, color);
    }
  }

  private withNodePort(
    cellId?: string | null,
    portId?: string | null,
    fn?: (node: Node, portId: string) => void,
  ): void {
    if (!cellId || !portId || !fn || !this.graph) {
      return;
    }
    const cell = this.graph.getCellById(cellId);
    if (cell && cell.isNode()) {
      fn(cell as Node, portId);
    }
  }

  private showNodePorts(node: Node, show: boolean): void {
    const ps = node.getPorts();
    for (let i = 0; i < ps.length; i += 1) {
      const id = ps[i].id as string;
      if (show) {
        const connected = this.isPortConnected(node, id);
        this.setPortVisible(node, id, true);
        this.setPortColor(
          node,
          id,
          connected ? COLOR_PORT_BLUE : COLOR_PORT_GRAY,
        );
      } else {
        // 연결된 포트라도 hover 중이 아니면 점을 숨깁니다.
        this.setPortVisible(node, id, false);
        this.setPortColor(node, id, COLOR_PORT_GRAY);
      }
    }
  }
}

function ensureGlobalX6Styles(): void {
  if (document.getElementById('sld-x6-style')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'sld-x6-style';
  style.textContent = `
    .x6-widget-stencil { background-color: #fff; }
    .x6-widget-stencil-title { background-color: #fff; }
    .x6-widget-stencil-group-title { background-color: #fff !important; }
  `;
  document.head.appendChild(style);
}

function registerSldEdge(): void {
  Graph.registerEdge(
    'sld-edge',
    {
      inherit: 'edge',
      attrs: {
        line: {
          stroke: '#1F1F1F',
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            width: 10,
            height: 6,
          },
        },
      },
    },
    true,
  );
}

/** 포트 좌표는 노드 bbox 대비 %/px — 리사이즈 시에도 비율이 유지되도록 `absolute` + `args` 사용 */
type SldPortMode = 'all' | 'horizontal' | 'vertical';

function buildSldPorts(mode: SldPortMode): Node.Metadata['ports'] {
  const getPortTemplate = (type: 'left' | 'right' | 'top' | 'bottom') => {
    return {
      position: type,
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    };
  };

  const useHorizontal = mode === 'all' || mode === 'horizontal';
  const useVertical = mode === 'all' || mode === 'vertical';

  const groups: Record<string, unknown> = {};
  const items: Array<{ group: 'left' | 'right' | 'top' | 'bottom' }> = [];

  if (useHorizontal) {
    groups['left'] = getPortTemplate('left');
    groups['right'] = getPortTemplate('right');
    items.push({ group: 'left' }, { group: 'right' });
  }

  if (useVertical) {
    groups['top'] = getPortTemplate('top');
    groups['bottom'] = getPortTemplate('bottom');
    items.push({ group: 'top' }, { group: 'bottom' });
  }

  return {
    groups,
    items,
  } as Node.Metadata['ports'];
}

function registerSldShapes(): void {
  // Busbar: 굵은 선(단선도 상의 버스바) 형태
  Graph.registerNode(
    'sld-bus',
    {
      inherit: 'rect',
      width: 140,
      height: 56,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'bar' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: 'transparent',
          strokeWidth: 0,
          fill: 'transparent',
          rx: 10,
          ry: 10,
        },
        bar: {
          refX: '0%',
          refY: `${(25 / 56) * 100}%`,
          refWidth: '100%',
          refHeight: `${(6 / 56) * 100}%`,
          rx: 3,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `${(16 / 56) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'BUS',
        },
      },
      ports: buildSldPorts('horizontal'),
    },
    true,
  );

  // Circuit Breaker: 회로 차단기(스위치) 아이콘
  Graph.registerNode(
    'sld-breaker',
    {
      inherit: 'rect',
      width: 140,
      height: 56,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'lineL' },
        { tagName: 'rect', selector: 'lineR' },
        { tagName: 'rect', selector: 'lever' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#D9D9D9',
          strokeWidth: 0,
          fill: 'transparent',
          rx: 10,
          ry: 10,
        },
        lineL: {
          refX: '0%',
          refY: `${(27 / 56) * 100}%`,
          refWidth: `${(50 / 140) * 100}%`,
          refHeight: `${(4 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        lineR: {
          refX: `${(90 / 140) * 100}%`,
          refY: `${(27 / 56) * 100}%`,
          refWidth: `${(50 / 140) * 100}%`,
          refHeight: `${(4 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        lever: {
          refX: '50%',
          refY: `${(14 / 56) * 100}%`,
          refWidth: `${(3 / 140) * 100}%`,
          refHeight: `${(34 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `${(6 / 56) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'CB',
        },
      },
      ports: SLD_PORTS_BREAKER,
    },
    true,
  );

  // Load: 부하(원형 아이콘)
  Graph.registerNode(
    'sld-load',
    {
      inherit: 'rect',
      width: SLD_LOAD_W,
      height: SLD_LOAD_H,
      markup: [
        { tagName: 'circle', selector: 'ring' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        ring: {
          refCx: '50%',
          refCy: '50%',
          refR: `${(SLD_LOAD_RING_R / SLD_LOAD_H) * 100}%`,
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: '#FFFFFF',
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'LOAD',
        },
      },
      ports: SLD_PORTS_LOAD,
    },
    true,
  );

  // Transformer: 변압기(2권선 겹침 / 교집합 형태)
  Graph.registerNode(
    'sld-transformer',
    {
      inherit: 'rect',
      width: SLD_TR_W,
      height: SLD_TR_H,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'circle', selector: 'coilL' },
        { tagName: 'circle', selector: 'coilR' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#D9D9D9',
          strokeWidth: 0,
          fill: 'transparent',
          rx: 8,
          ry: 8,
        },
        coilL: {
          refCx: '35%',
          refCy: '60%',
          refR: `40%`,
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: 'transparent',
        },
        coilR: {
          refCx: `65%`,
          refCy: '60%',
          refR: `40%`,
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: 'transparent',
        },
        label: {
          refX: '50%',
          refY: `0%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'Trans',
        },
      },
      ports: SLD_PORTS_TRANSFORMER,
    },
    true,
  );

  // Disconnector: 단로기
  Graph.registerNode(
    'sld-disconnector',
    {
      inherit: 'rect',
      width: 140,
      height: 56,
      markup: [
        {
          tagName: 'g',
          selector: 'left-group',
          children: [
            { tagName: 'rect', selector: 'left', groupSelector: 'line' },
            { tagName: 'circle', selector: 'lco', groupSelector: 'co' },
            { tagName: 'circle', selector: 'lci', groupSelector: 'ci' },
          ],
        },
        { tagName: 'rect', selector: 'switch', groupSelector: 'line' },
        {
          tagName: 'g',
          selector: 'right-group',
          children: [
            { tagName: 'rect', selector: 'right', groupSelector: 'line' },
            { tagName: 'circle', selector: 'rco', groupSelector: 'co' },
            { tagName: 'circle', selector: 'rci', groupSelector: 'ci' },
          ],
        },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        line: {
          refY: `${(28 / 56) * 100}%`,
          refHeight: `${(2 / 56) * 100}%`,
          fill: '#1F1F1F',
          stroke: '#1F1F1F',
        },
        left: {
          refX: '0%',
          refWidth: `${(50 / 140) * 100}%`,
        },
        right: {
          refX: `${(90 / 140) * 100}%`,
          refWidth: `${(50 / 140) * 100}%`,
        },
        co: {
          refR: `${(8 / 56) * 100}%`,
          refCy: `${(28 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        ci: {
          refR: `${(4 / 56) * 100}%`,
          refCy: `${(28 / 56) * 100}%`,
          fill: '#FFFFFF',
        },
        lco: { refCx: `${(50 / 140) * 100}%` },
        lci: { refCx: `${(50 / 140) * 100}%` },
        rco: { refCx: `${(90 / 140) * 100}%` },
        rci: { refCx: `${(90 / 140) * 100}%` },
        switch: {
          refX: `${(56 / 140) * 100}%`,
          refY: `${(27 / 56) * 100}%`,
          refWidth: `${(34 / 140) * 100}%`,
          refHeight: `${(2 / 56) * 100}%`,
          transform: DISCONNECTOR_SWITCH_OPEN,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `0%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'DS',
        },
      },
      ports: SLD_PORTS_DISCONNECTOR,
    },
    true,
  );

  // Ground: 접지
  Graph.registerNode(
    'sld-ground',
    {
      inherit: 'rect',
      width: 56,
      height: 56,
      markup: [
        { tagName: 'rect', selector: 'vline' },
        { tagName: 'rect', selector: 'g1' },
        { tagName: 'rect', selector: 'g2' },
        { tagName: 'rect', selector: 'g3' },
      ],
      attrs: {
        vline: {
          refX: `${(58 / 56) * 100 - 56}%`,
          refY: `${(10 / 56) * 100}%`,
          refWidth: `${(3 / 56) * 100}%`,
          refHeight: `${(18 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        g1: {
          refX: `${(42 / 56) * 100 - 56}%`,
          refY: `${(30 / 56) * 100}%`,
          refWidth: `${(35 / 56) * 100}%`,
          refHeight: `${(2 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        g2: {
          refX: `${(47 / 56) * 100 - 56}%`,
          refY: `${(35 / 56) * 100}%`,
          refWidth: `${(25 / 56) * 100}%`,
          refHeight: `${(2 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
        g3: {
          refX: `${(52 / 56) * 100 - 56}%`,
          refY: `${(40 / 56) * 100}%`,
          refWidth: `${(15 / 56) * 100}%`,
          refHeight: `${(2 / 56) * 100}%`,
          fill: '#1F1F1F',
        },
      },
      ports: SLD_PORTS_GROUND,
    },
    true,
  );

  // Generator: 발전기
  Graph.registerNode(
    'sld-generator',
    {
      inherit: 'rect',
      width: SLD_LOAD_W,
      height: SLD_LOAD_H,
      markup: [
        { tagName: 'circle', selector: 'ring' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        ring: {
          refCx: '50%',
          refCy: '50%',
          refR: `${(SLD_LOAD_RING_R / SLD_LOAD_H) * 100}%`,
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: '#FFFFFF',
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'GEN',
        },
      },
      ports: SLD_PORTS_GENERATOR,
    },
    true,
  );
}

function buildSldBusMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-bus',
    width: 140,
    height: 56,
    ports,
    data: { kind: 'bus' },
  };
}

function buildSldBreakerMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-breaker',
    width: 140,
    height: 56,
    ports,
    data: { kind: 'breaker' },
  };
}

function buildSldLoadMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-load',
    width: SLD_LOAD_W,
    height: SLD_LOAD_H,
    ports,
    data: { kind: 'load' },
  };
}

function buildSldTransformerMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-transformer',
    width: SLD_TR_W,
    height: SLD_TR_H,
    ports,
    data: { kind: 'transformer' },
  };
}

function buildSldDisconnectorMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-disconnector',
    width: 140,
    height: 56,
    ports,
    data: { kind: 'disconnector' },
  };
}

function buildSldGroundMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-ground',
    width: 56,
    height: 56,
    ports,
    data: { kind: 'ground' },
  };
}

function buildSldGeneratorMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-generator',
    width: SLD_LOAD_W,
    height: SLD_LOAD_H,
    ports,
    data: { kind: 'generator' },
  };
}
