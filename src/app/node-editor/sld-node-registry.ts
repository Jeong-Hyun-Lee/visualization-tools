import { Graph, Node } from '@antv/x6';

export const COLOR_PORT_GRAY = '#C2C8D5';
export const COLOR_PORT_BLUE = '#5F95FF';

export const DISCONNECTOR_SWITCH_CENTER = { x: -2, y: -2 };
export const DISCONNECTOR_SWITCH_OPEN = `rotate(-30 ${DISCONNECTOR_SWITCH_CENTER.x} ${DISCONNECTOR_SWITCH_CENTER.y})`;
export const DISCONNECTOR_SWITCH_CLOSE = `rotate(-10 ${DISCONNECTOR_SWITCH_CENTER.x} ${DISCONNECTOR_SWITCH_CENTER.y})`;

/** 포트 좌표는 노드 bbox 대비 %/px — 리사이즈 시에도 비율이 유지되도록 `absolute` + `args` 사용 */
export type SldPortMode = 'all' | 'horizontal' | 'vertical';

export function buildSldPorts(mode: SldPortMode): Node.Metadata['ports'] {
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

export const SLD_PORTS_BREAKER = buildSldPorts('horizontal');
/** 부하/발전기: 정사각형 바운딩 */
export const SLD_LOAD_W = 56;
export const SLD_LOAD_H = 56;
export const SLD_LOAD_RING_R = 26;
export const SLD_PORTS_LOAD = buildSldPorts('all');
/** 변압기 */
export const SLD_TR_W = 88;
/** 상·하 라벨과 이중 원호 사이 여유 */
export const SLD_TR_H = 74;
export const SLD_PORTS_TRANSFORMER = buildSldPorts('horizontal');
export const SLD_PORTS_DISCONNECTOR = buildSldPorts('horizontal');
export const SLD_PORTS_GROUND = buildSldPorts('vertical');
export const SLD_PORTS_GENERATOR = buildSldPorts('all');
/** 이미지형 차단기 명판 */
export const SLD_BREAKER_W = 132;
export const SLD_BREAKER_H = 76;
/** 수직 모선 */
export const SLD_BUS_V_W = 44;
export const SLD_BUS_V_H = 140;
export const SLD_BUS_V_BAR_PX = 6;

export const SLD_PORTS_FUSE = buildSldPorts('horizontal');
export const SLD_PORTS_RELAY = buildSldPorts('horizontal');
export const SLD_PORTS_CT = buildSldPorts('horizontal');
export const SLD_PORTS_METER = buildSldPorts('horizontal');
export const SLD_PORTS_SMALL_BOX = buildSldPorts('all');
export const SLD_PORTS_TERMINAL = buildSldPorts('vertical');
export const SLD_PORTS_POTHEAD = buildSldPorts('vertical');

export const SLD_PORTS_NONE = {
  groups: {},
  items: [],
} as unknown as Node.Metadata['ports'];

export function ensureGlobalX6Styles(): void {
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

export function registerSldEdge(): void {
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

export function registerSldShapes(): void {
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
          refY: `${(24 / 56) * 100}%`,
          refWidth: '100%',
          refHeight: `${(6 / 56) * 100}%`,
          rx: 2,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `${(13 / 56) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 11,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'MAIN BUS',
        },
      },
      ports: buildSldPorts('horizontal'),
    },
    true,
  );

  Graph.registerNode(
    'sld-bus-v',
    {
      inherit: 'rect',
      width: SLD_BUS_V_W,
      height: SLD_BUS_V_H,
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
          fill: 'transparent',
        },
        bar: {
          refX: `${((SLD_BUS_V_W - SLD_BUS_V_BAR_PX) / 2 / SLD_BUS_V_W) * 100}%`,
          refY: '0%',
          refWidth: `${(SLD_BUS_V_BAR_PX / SLD_BUS_V_W) * 100}%`,
          refHeight: '100%',
          rx: 1,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `-4%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 9,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'BUS',
        },
      },
      ports: buildSldPorts('vertical'),
    },
    true,
  );

  Graph.registerNode(
    'sld-breaker',
    {
      inherit: 'rect',
      width: SLD_BREAKER_W,
      height: SLD_BREAKER_H,
      markup: [
        { tagName: 'rect', selector: 'lineL' },
        { tagName: 'rect', selector: 'lineR' },
        { tagName: 'text', selector: 'markL' },
        { tagName: 'text', selector: 'markR' },
        { tagName: 'rect', selector: 'plate' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        lineL: {
          refX: '0%',
          refY: `${(37 / SLD_BREAKER_H) * 100}%`,
          refWidth: `${(22 / SLD_BREAKER_W) * 100}%`,
          refHeight: `${(4 / SLD_BREAKER_H) * 100}%`,
          fill: '#1F1F1F',
        },
        lineR: {
          refX: `${(110 / SLD_BREAKER_W) * 100}%`,
          refY: `${(37 / SLD_BREAKER_H) * 100}%`,
          refWidth: `${(22 / SLD_BREAKER_W) * 100}%`,
          refHeight: `${(4 / SLD_BREAKER_H) * 100}%`,
          fill: '#1F1F1F',
        },
        markL: {
          refX: `${(20 / SLD_BREAKER_W) * 100}%`,
          refY: `${(35 / SLD_BREAKER_H) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: '×',
        },
        markR: {
          refX: `${(112 / SLD_BREAKER_W) * 100}%`,
          refY: `${(35 / SLD_BREAKER_H) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: '×',
        },
        plate: {
          refX: `${(22 / SLD_BREAKER_W) * 100}%`,
          refY: `${(14 / SLD_BREAKER_H) * 100}%`,
          refWidth: `${(88 / SLD_BREAKER_W) * 100}%`,
          refHeight: `${(50 / SLD_BREAKER_H) * 100}%`,
          stroke: '#1F1F1F',
          strokeWidth: 1.6,
          fill: '#FFFFFF',
          rx: 2,
          ry: 2,
        },
        label: {
          refX: `${(66 / SLD_BREAKER_W) * 100}%`,
          refY: `${(39 / SLD_BREAKER_H) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 8,
          fontWeight: 700,
          fill: '#1F1F1F',
          lineHeight: 10,
          text: '52-M1\n1200A\nN.C.',
        },
      },
      ports: SLD_PORTS_BREAKER,
    },
    true,
  );

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
          fill: 'transparent',
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 10,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'MOTOR',
        },
      },
      ports: SLD_PORTS_LOAD,
    },
    true,
  );

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
        { tagName: 'text', selector: 'sublabel' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: 'transparent',
          strokeWidth: 0,
          fill: 'transparent',
          rx: 8,
          ry: 8,
        },
        coilL: {
          refCx: '42%',
          refCy: `${(37 / SLD_TR_H) * 100}%`,
          refR: '36%',
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: 'none',
        },
        coilR: {
          refCx: '58%',
          refCy: `${(37 / SLD_TR_H) * 100}%`,
          refR: '36%',
          stroke: '#1F1F1F',
          strokeWidth: 2,
          fill: 'none',
        },
        label: {
          refX: '50%',
          refY: `${(2 / SLD_TR_H) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'top',
          fontSize: 9,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'PT / VT',
        },
        sublabel: {
          refX: '50%',
          refY: `${(66 / SLD_TR_H) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'top',
          fontSize: 7,
          fill: '#374151',
          text: '14.4k:120V',
        },
      },
      ports: SLD_PORTS_TRANSFORMER,
    },
    true,
  );

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
          fill: 'transparent',
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 10,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'GEN',
        },
      },
      ports: SLD_PORTS_GENERATOR,
    },
    true,
  );

  Graph.registerNode(
    'sld-relay',
    {
      inherit: 'rect',
      width: 54,
      height: 54,
      markup: [
        { tagName: 'circle', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refCx: '50%',
          refCy: '55%',
          refR: '42%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
        label: {
          refX: '50%',
          refY: '56%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 11,
          fontWeight: 800,
          fill: '#1F1F1F',
          text: '87',
        },
      },
      ports: SLD_PORTS_RELAY,
    },
    true,
  );

  Graph.registerNode(
    'sld-fuse',
    {
      inherit: 'rect',
      width: 72,
      height: 34,
      markup: [
        { tagName: 'rect', selector: 'lineL' },
        { tagName: 'rect', selector: 'lineR' },
        { tagName: 'rect', selector: 'element' },
      ],
      attrs: {
        lineL: {
          refX: '0%',
          refY: `${(16 / 34) * 100}%`,
          refWidth: `${(30 / 72) * 100}%`,
          refHeight: `${(2 / 34) * 100}%`,
          fill: '#1F1F1F',
        },
        lineR: {
          refX: `${(44 / 72) * 100}%`,
          refY: `${(16 / 34) * 100}%`,
          refWidth: `${(28 / 72) * 100}%`,
          refHeight: `${(2 / 34) * 100}%`,
          fill: '#1F1F1F',
        },
        element: {
          refX: `${(30 / 72) * 100}%`,
          refY: `${(6 / 34) * 100}%`,
          refWidth: `${(14 / 72) * 100}%`,
          refHeight: `${(22 / 34) * 100}%`,
          stroke: '#1F1F1F',
          strokeWidth: 0.75,
          fill: '#F3F4F6',
          rx: 1,
        },
      },
      ports: SLD_PORTS_FUSE,
    },
    true,
  );

  Graph.registerNode(
    'sld-ct',
    {
      inherit: 'rect',
      width: 84,
      height: 42,
      markup: [
        { tagName: 'rect', selector: 'bus' },
        { tagName: 'circle', selector: 'c1' },
        { tagName: 'circle', selector: 'c2' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        bus: {
          refX: '0%',
          refY: `${(20 / 42) * 100}%`,
          refWidth: '100%',
          refHeight: `${(2 / 42) * 100}%`,
          fill: '#1F1F1F',
        },
        c1: {
          refCx: '36%',
          refCy: '50%',
          refR: '24%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
        c2: {
          refCx: '64%',
          refCy: '50%',
          refR: '24%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
        label: {
          refX: '50%',
          refY: '10%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 8,
          fontWeight: 600,
          fill: '#374151',
          text: '500:5',
        },
      },
      ports: SLD_PORTS_CT,
    },
    true,
  );

  Graph.registerNode(
    'sld-ts',
    {
      inherit: 'rect',
      width: 48,
      height: 48,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
          rx: 2,
          ry: 2,
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 800,
          fill: '#1F1F1F',
          text: 'TS',
        },
      },
      ports: SLD_PORTS_SMALL_BOX,
    },
    true,
  );

  Graph.registerNode(
    'sld-sb',
    {
      inherit: 'rect',
      width: 48,
      height: 48,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
          rx: 2,
          ry: 2,
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 12,
          fontWeight: 800,
          fill: '#1F1F1F',
          text: 'SB',
        },
      },
      ports: SLD_PORTS_SMALL_BOX,
    },
    true,
  );

  Graph.registerNode(
    'sld-indicator',
    {
      inherit: 'rect',
      width: 56,
      height: 56,
      markup: [
        { tagName: 'circle', selector: 'ring' },
        { tagName: 'path', selector: 'burst' },
      ],
      attrs: {
        ring: {
          refCx: '50%',
          refCy: '50%',
          refR: '32%',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
        burst: {
          d: 'M 28 6 L 28 14 M 28 42 L 28 50 M 8 28 L 16 28 M 40 28 L 48 28 M 12 12 L 17 17 M 39 39 L 44 44 M44 12 L39 17 M17 39 L12 44',
          stroke: '#1F1F1F',
          strokeWidth: 0.9,
          fill: 'none',
        },
      },
      ports: buildSldPorts('all'),
    },
    true,
  );

  Graph.registerNode(
    'sld-terminal',
    {
      inherit: 'rect',
      width: 52,
      height: 58,
      markup: [{ tagName: 'polygon', selector: 'tip' }],
      attrs: {
        tip: {
          refPoints: '26,6 8,50 44,50',
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
      },
      ports: SLD_PORTS_TERMINAL,
    },
    true,
  );

  Graph.registerNode(
    'sld-meter',
    {
      inherit: 'rect',
      width: 128,
      height: 52,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#1F1F1F',
          strokeWidth: 0.8,
          fill: '#FFFFFF',
          rx: 3,
          ry: 3,
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fontSize: 8,
          fontWeight: 700,
          fill: '#1F1F1F',
          text: 'PXM6000\nMETER',
        },
      },
      ports: SLD_PORTS_METER,
    },
    true,
  );

  Graph.registerNode(
    'sld-pothead',
    {
      inherit: 'rect',
      width: 52,
      height: 58,
      markup: [
        { tagName: 'circle', selector: 'head' },
        { tagName: 'rect', selector: 'stem' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        head: {
          refCx: '50%',
          refCy: `${(16 / 58) * 100}%`,
          refR: `${(10 / 58) * 100}%`,
          stroke: '#1F1F1F',
          strokeWidth: 1,
          fill: '#FFFFFF',
        },
        stem: {
          refX: '48.5%',
          refY: `${(26 / 58) * 100}%`,
          refWidth: '3%',
          refHeight: `${(20 / 58) * 100}%`,
          fill: '#1F1F1F',
        },
        label: {
          refX: '50%',
          refY: `${(47 / 58) * 100}%`,
          textAnchor: 'middle',
          textVerticalAnchor: 'top',
          fontSize: 7,
          fontWeight: 600,
          fill: '#374151',
          text: '(3) POT',
        },
      },
      ports: SLD_PORTS_POTHEAD,
    },
    true,
  );

  Graph.registerNode(
    'sld-equipment-region',
    {
      inherit: 'rect',
      width: 200,
      height: 100,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          fill: 'rgba(255,255,255,0.02)',
          stroke: '#6B7280',
          strokeWidth: 0.6,
          strokeDasharray: '4 3',
          rx: 6,
          ry: 6,
        },
        label: {
          refX: '10',
          refY: '16',
          textAnchor: 'start',
          textVerticalAnchor: 'middle',
          fontSize: 11,
          fontWeight: 700,
          fill: '#374151',
          text: 'USG-1A',
        },
      },
      ports: SLD_PORTS_NONE,
    },
    true,
  );
}

export function buildSldBusMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-bus',
    width: 140,
    height: 56,
    ports,
    data: { kind: 'bus' },
  };
}

export function buildSldBusVMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-bus-v',
    width: SLD_BUS_V_W,
    height: SLD_BUS_V_H,
    ports,
    data: { kind: 'bus-v' },
  };
}

export function buildSldBreakerMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-breaker',
    width: SLD_BREAKER_W,
    height: SLD_BREAKER_H,
    ports,
    data: { kind: 'breaker' },
  };
}

export function buildSldLoadMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-load',
    width: SLD_LOAD_W,
    height: SLD_LOAD_H,
    ports,
    data: { kind: 'load' },
  };
}

export function buildSldTransformerMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-transformer',
    width: SLD_TR_W,
    height: SLD_TR_H,
    ports,
    data: { kind: 'transformer' },
  };
}

export function buildSldDisconnectorMeta(
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

export function buildSldGroundMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-ground',
    width: 56,
    height: 56,
    ports,
    data: { kind: 'ground' },
  };
}

export function buildSldGeneratorMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-generator',
    width: SLD_LOAD_W,
    height: SLD_LOAD_H,
    ports,
    data: { kind: 'generator' },
  };
}

export function buildSldRelayMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-relay',
    width: 54,
    height: 54,
    ports,
    data: { kind: 'relay' },
  };
}

export function buildSldFuseMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-fuse',
    width: 72,
    height: 34,
    ports,
    data: { kind: 'fuse' },
  };
}

export function buildSldCtMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-ct',
    width: 84,
    height: 42,
    ports,
    data: { kind: 'ct' },
  };
}

export function buildSldTsMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-ts',
    width: 48,
    height: 48,
    ports,
    data: { kind: 'ts' },
  };
}

export function buildSldSbMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-sb',
    width: 48,
    height: 48,
    ports,
    data: { kind: 'sb' },
  };
}

export function buildSldIndicatorMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-indicator',
    width: 56,
    height: 56,
    ports,
    data: { kind: 'indicator' },
  };
}

export function buildSldTerminalMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-terminal',
    width: 52,
    height: 58,
    ports,
    data: { kind: 'terminal' },
  };
}

export function buildSldMeterMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-meter',
    width: 128,
    height: 52,
    ports,
    data: { kind: 'meter' },
  };
}

export function buildSldPotheadMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-pothead',
    width: 52,
    height: 58,
    ports,
    data: { kind: 'pothead' },
  };
}

export function buildSldEquipmentRegionMeta(): Node.Metadata {
  return {
    shape: 'sld-equipment-region',
    width: 200,
    height: 100,
    ports: SLD_PORTS_NONE,
    data: { kind: 'equipment-region' },
  };
}
