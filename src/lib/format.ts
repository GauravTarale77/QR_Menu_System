export const rupees = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(n);