import 'package:flutter/material.dart';

/// ResponsiveLayout switches between [mobileView] and [desktopView]
/// based on the viewport width (breakpoint: 800px).
/// - Width > 800px: Desktop layout (Shonen Jump magazine web layout)
/// - Width <= 800px: Mobile phone layout with 2-column grid and bottom tabs
class ResponsiveLayout extends StatelessWidget {
  final Widget mobileView;
  final Widget desktopView;

  const ResponsiveLayout({
    Key? key,
    required this.mobileView,
    required this.desktopView,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 800) {
          // DESKTOP - show like Shonen Jump website
          return desktopView;
        } else {
          // PHONE - show like mobile screenshot
          return mobileView;
        }
      },
    );
  }
}
