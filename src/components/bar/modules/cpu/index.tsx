import { Module } from '../../shared/module';
import { bind, Variable } from 'astal';
import { Astal, Gtk } from 'astal/gtk3';
import { BarBoxChild } from 'src/components/bar/types';
import options from 'src/configuration';
import { InputHandlerService } from '../../utils/input/inputHandler';
import CpuUsageService from 'src/services/system/cpuUsage';
import { useHook } from 'src/lib/shared/hookHandler';
const inputHandler = InputHandlerService.getInstance();

const {
    label,
    round,
    showPerCoreUsage,
    leftClick,
    rightClick,
    middleClick,
    scrollUp,
    scrollDown,
    pollingInterval,
    icon,
    colorLow,
    colorMedium,
    colorHigh,
} = options.bar.customModules.cpu;

const cpuService = new CpuUsageService({ frequency: pollingInterval });

const applyCssColor = (widget: Gtk.Widget, color: string): void => {
    const cssValue = color?.trim().length ? `color: ${color};` : '';
    (widget as Gtk.Widget & { css?: string }).css = cssValue;
};

export const Cpu = (): BarBoxChild => {
    cpuService.initialize();

    const labelBinding = Variable.derive(
        [bind(cpuService.cpu), bind(round)],
        (cpuUsg: number, shouldRound: boolean) => {
            return shouldRound ? `${Math.round(cpuUsg)}%` : `${cpuUsg.toFixed(2)}%`;
        },
    );
    const colorBinding = Variable.derive(
        [bind(cpuService.cpu), bind(colorLow), bind(colorMedium), bind(colorHigh)],
        (cpuUsg: number, low: string, medium: string, high: string) => {
            if (cpuUsg < 70) {
                return low;
            }

            if (cpuUsg < 90) {
                return medium;
            }

            return high;
        },
    );

    const createColorHook = () => {
        return (widget: Gtk.Widget): void => {
            useHook(widget, colorBinding, () => {
                const updateColor = (): void => {
                    applyCssColor(widget, colorBinding.get());
                };

                updateColor();

                return () => {
                    applyCssColor(widget, '');
                };
            });
        };
    };

    const tooltipBinding = Variable.derive(
        [bind(cpuService.cpu), bind(cpuService.perCoreUsage), bind(round), bind(showPerCoreUsage)],
        (cpuUsg: number, perCoreUsage: number[], round: boolean, showPerCore: boolean) => {
            if (!showPerCore) {
                const displayUsage = round ? Math.round(cpuUsg) : cpuUsg.toFixed(2);
                return `CPU: ${displayUsage}%`;
            }

            if (perCoreUsage.length === 0) return 'CPU';

            const coreLines = perCoreUsage
                .map((usage, index) => {
                    const displayUsage = round ? Math.round(usage) : usage.toFixed(2);
                    return `Core ${index}: ${displayUsage}%`;
                })
                .join('\n');

            return coreLines;
        },
    );

    let inputHandlerBindings: Variable<void>;

    const cpuModule = Module({
        textIcon: bind(icon),
        label: labelBinding(),
        tooltipText: tooltipBinding(),
        boxClass: 'cpu',
        showLabelBinding: bind(label),
        textIconHook: createColorHook(),
        labelHook: createColorHook(),
        props: {
            setup: (self: Astal.Button) => {
                inputHandlerBindings = inputHandler.attachHandlers(self, {
                    onPrimaryClick: {
                        cmd: leftClick,
                    },
                    onSecondaryClick: {
                        cmd: rightClick,
                    },
                    onMiddleClick: {
                        cmd: middleClick,
                    },
                    onScrollUp: {
                        cmd: scrollUp,
                    },
                    onScrollDown: {
                        cmd: scrollDown,
                    },
                });
            },
            onDestroy: () => {
                inputHandlerBindings.drop();
                labelBinding.drop();
                tooltipBinding.drop();
                colorBinding.drop();
                cpuService.destroy();
            },
        },
    });

    return cpuModule;
};
