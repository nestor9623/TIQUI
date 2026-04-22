import { ChangeDetectionStrategy, Component } from '@angular/core';

interface WorldLocation {
  code: string;
  city: string;
  country: string;
  coords: [number, number];
}

interface ProjectedLocation extends WorldLocation {
  x: number;
  y: number;
}

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 500;
const PADDING_X = 34;
const PADDING_Y = 26;

const CONTINENTS = [
  {
    id: 'north-america',
    path: 'M39 131L61 117L93 106L122 94L165 89L188 72L216 64L254 71L288 87L316 116L309 136L281 148L266 169L244 175L210 166L187 173L160 167L132 155L113 141L86 139L59 146Z',
  },
  {
    id: 'south-america',
    path: 'M235 202L261 212L279 237L282 266L274 295L264 327L245 356L229 341L223 312L226 280L220 247Z',
  },
  {
    id: 'europe',
    path: 'M456 111L486 97L519 95L543 105L572 110L590 123L579 139L553 143L535 137L519 145L492 140L471 130Z',
  },
  {
    id: 'africa',
    path: 'M492 154L525 147L557 157L579 179L587 216L578 254L559 282L529 301L504 291L489 265L485 236L476 202L482 176Z',
  },
  {
    id: 'asia',
    path: 'M573 111L608 95L645 98L679 88L722 96L767 107L809 127L851 152L848 176L818 187L787 183L762 196L716 188L688 194L654 182L628 178L603 163L579 159L566 139Z',
  },
  {
    id: 'oceania',
    path: 'M756 283L790 278L819 288L838 303L829 319L798 321L773 313L752 301Z',
  },
] as const;

const WORLD_LOCATIONS: ReadonlyArray<WorldLocation> = [
  { code: 'BUE', city: 'Buenos Aires', country: 'Argentina', coords: [-34.6037, -58.3816] },
  { code: 'YUL', city: 'Montreal', country: 'Canada', coords: [45.5017, -73.5673] },
  { code: 'LON', city: 'London', country: 'United Kingdom', coords: [51.5074, -0.1278] },
  { code: 'MAD', city: 'Madrid', country: 'Spain', coords: [40.4168, -3.7038] },
  { code: 'CAI', city: 'Cairo', country: 'Egypt', coords: [30.0444, 31.2357] },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', coords: [1.3521, 103.8198] },
  { code: 'TYO', city: 'Tokyo', country: 'Japan', coords: [35.6762, 139.6503] },
];

function projectToWorld([lat, lon]: [number, number]): { x: number; y: number } {
  const x = PADDING_X + ((lon + 180) / 360) * (SVG_WIDTH - PADDING_X * 2);
  const y = PADDING_Y + ((90 - lat) / 180) * (SVG_HEIGHT - PADDING_Y * 2);

  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
}

function buildRoutePath(points: ReadonlyArray<ProjectedLocation>): string {
  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];
      const controlX = Number(((previous.x + point.x) / 2).toFixed(1));
      const controlY = Number((Math.min(previous.y, point.y) - 24 - Math.abs(point.x - previous.x) * 0.08).toFixed(1));

      return `Q ${controlX} ${controlY} ${point.x} ${point.y}`;
    })
    .join(' ');
}

@Component({
  selector: 'app-world-coverage-map',
  template: `
    <div class="tiqui-world-map" role="img" aria-label="Mapa mundial vectorial con rutas animadas entre ciudades reales">
      <svg class="tiqui-world-map__svg" [attr.viewBox]="'0 0 ' + svgWidth + ' ' + svgHeight" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="tiquiRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffffff"></stop>
            <stop offset="100%" stop-color="#ffc1c7"></stop>
          </linearGradient>
        </defs>

        <rect x="8" y="8" width="984" height="484" rx="24" class="tiqui-world-map__ocean"></rect>

        <g>
          @for (continent of continents; track continent.id) {
            <path class="tiqui-world-map__continent" [attr.d]="continent.path"></path>
          }
        </g>

        <path class="tiqui-world-map__route-base" [attr.d]="routePath"></path>
        <path class="tiqui-world-map__route-active" [attr.d]="routePath"></path>

        @for (point of points; track point.code) {
          <g class="tiqui-world-map__marker" [attr.transform]="'translate(' + point.x + ' ' + point.y + ')'">
            <circle class="tiqui-world-map__marker-ring" r="12"></circle>
            <path class="tiqui-world-map__pin" d="M0-14C7.5-14 13.2-8.3 13.2-1.6C13.2 5.6 7 10.8 0 19C-7 10.8-13.2 5.6-13.2-1.6C-13.2-8.3-7.5-14 0-14Z"></path>
            <circle class="tiqui-world-map__marker-core" r="4.2"></circle>
            <text class="tiqui-world-map__label" x="16" y="-10">{{ point.code }}</text>
          </g>
        }

        <circle class="tiqui-world-map__traveler" r="5.5">
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" [attr.path]="routePath"></animateMotion>
        </circle>
      </svg>

      <div class="tiqui-world-map__veil" aria-hidden="true"></div>
    </div>
  `,
  styleUrl: './world-coverage-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldCoverageMapComponent {
  readonly svgWidth = SVG_WIDTH;
  readonly svgHeight = SVG_HEIGHT;
  readonly continents = CONTINENTS;
  readonly points: ReadonlyArray<ProjectedLocation> = WORLD_LOCATIONS.map(location => ({
    ...location,
    ...projectToWorld(location.coords),
  }));
  readonly routePath = buildRoutePath(this.points);
}
