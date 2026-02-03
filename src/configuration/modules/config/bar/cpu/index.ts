import { opt } from 'src/lib/options';

export default {
    icon: opt(''),
    label: opt(true),
    round: opt(true),
    showPerCoreUsage: opt(true),
    pollingInterval: opt(2000),
    colorLow: opt('#a7c080'),
    colorMedium: opt('#dbbc7f'),
    colorHigh: opt('#e67e80'),
    leftClick: opt(''),
    rightClick: opt(''),
    middleClick: opt(''),
    scrollUp: opt(''),
    scrollDown: opt(''),
};
