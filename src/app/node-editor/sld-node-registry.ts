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
export const SLD_TR_W = 80;
export const SLD_TR_H = 56;
export const SLD_PORTS_TRANSFORMER = buildSldPorts('horizontal');
export const SLD_PORTS_DISCONNECTOR = buildSldPorts('horizontal');
export const SLD_PORTS_GROUND = buildSldPorts('vertical');
export const SLD_PORTS_GENERATOR = buildSldPorts('all');

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

export function buildSldBusMeta(ports: Node.Metadata['ports']): Node.Metadata {
  return {
    shape: 'sld-bus',
    width: 140,
    height: 56,
    ports,
    data: { kind: 'bus' },
  };
}

export function buildSldBreakerMeta(
  ports: Node.Metadata['ports'],
): Node.Metadata {
  return {
    shape: 'sld-breaker',
    width: 140,
    height: 56,
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
